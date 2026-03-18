use rand::Rng;
use rustc_hash::FxHashMap;
use spacetimedb::{
    ConnectionId, Identity, ReducerContext, ScheduleAt, Table, TryInsertError, rand, reducer,
};

use crate::{
    model::{
        Avatar, DeckCard, DeleteRoom, Feedback, OngoingVote, Participant, ParticipantRole,
        Participation, Profile, Room, RoomRevealOutcome, RoomRevealVote, delete_room, feedback,
        ongoing_vote, participant, participation, profile, room, room_reveal_outcome,
    },
    tweaks::{default_deck, get_deletion_time, validate_feedback, validate_profile_name},
};

#[reducer()]
pub fn handle_delete_room(ctx: &ReducerContext, row: DeleteRoom) -> Result<(), String> {
    if ctx.connection_id().is_some() {
        return Err("Reducer is schedule-only".to_string());
    }

    let room = ctx
        .db
        .room()
        .id()
        .find(row.room_id)
        .ok_or("Room not found")?;
    log::info!("Deleting room {}", room.code);
    if ctx.db.room().id().delete(room.id) {
        log::warn!("Room {} was already deleted", room.code);
    }

    let _deleted_participants_count = ctx
        .db
        .participant()
        .by_room_id()
        .filter(room.id)
        .map(|participant| {
            ctx.db
                .ongoing_vote()
                .participant_id()
                .delete(participant.id);
            ctx.db.participant().delete(participant);
        })
        .count();

    let deleted_particip_count = ctx.db.participant().by_room_id().delete(room.id);
    log::debug!(
        "Deleted {} participants from room {}",
        deleted_particip_count,
        room.code
    );
    let deleted_reveal_outcome_count = ctx.db.room_reveal_outcome().by_room_id().delete(room.id);
    log::debug!(
        "Deleted {} reveal outcomes from room {}",
        deleted_reveal_outcome_count,
        room.code
    );

    Ok(())
}

pub fn schedule_delete_room(ctx: &ReducerContext, room: &Room) -> Result<(), String> {
    let deletion_time = get_deletion_time(ctx.timestamp, room);
    log::trace!(
        "Scheduling deletion of room {} at {}",
        room.code,
        deletion_time
    );
    if !ctx.db.delete_room().room_id().delete(room.id) {
        log::debug!("First time deletion scheduled for room {}", room.code);
    }
    ctx.db.delete_room().insert(DeleteRoom {
        room_id: room.id,
        scheduled_at: ScheduleAt::Time(deletion_time),
    });
    Ok(())
}

pub fn generate_room_code(rng: &mut impl Rng) -> String {
    let dist = rand::distributions::Alphanumeric;
    let mut code = String::new();
    for _ in 0..6 {
        loop {
            let c = rng.sample(dist) as char;
            // Skip visually confusable characters (verwechselbare Zeichen)
            // Typically, avoid: 0 (zero), O (capital o), I (capital i), l (small L)
            if ['0', 'O', 'I', 'l'].contains(&c) {
                continue;
            }
            code.push(c);
            break;
        }
    }
    code
}

pub fn synchronize_participant_with_profile(
    ctx: &ReducerContext,
    room: &Room,
    profile: &Profile,
) -> Result<Participant, String> {
    log::debug!(
        "Synchronizing participant in room {} with profile {}",
        room.code,
        profile.identity
    );
    let participant = ctx
        .db
        .participant()
        .by_identity_room_id()
        .filter((profile.identity, room.id))
        .next()
        .map_or_else(
            || {
                log::trace!(
                    "Creating new participant for profile {} in room {}",
                    profile.identity,
                    room.code
                );
                ctx.db.participant().insert(Participant {
                    id: 0,
                    identity: profile.identity,
                    room_id: room.id,
                    name: profile.name.clone(),
                    avatar: profile.avatar.clone(),
                    role: ParticipantRole::Player,
                })
            },
            |existing_participant| {
                log::trace!(
                    "Updating existing participant for profile {} in room {}",
                    profile.identity,
                    room.code
                );
                ctx.db.participant().id().update(Participant {
                    name: profile.name.clone(),
                    avatar: profile.avatar.clone(),
                    ..existing_participant
                })
            },
        );

    Ok(participant)
}

pub fn unregister_participation(
    ctx: &ReducerContext,
    participation: Participation,
    participant: Option<&Participant>,
) -> Result<(), String> {
    log::info!(
        "Unregistering participation {}",
        participation.connection_id
    );
    let participant = participant
        .cloned()
        .or_else(|| {
            log::trace!("Finding participant {}", participation.participant_id);
            ctx.db.participant().id().find(participation.participant_id)
        })
        .ok_or("Participant not found")?;

    ctx.db.participation().delete(participation);
    // Check for any remaining participations on the room
    let is_active_participants = ctx
        .db
        .participant()
        .by_room_id()
        .filter(participant.room_id)
        .any(|participant| {
            ctx.db
                .participation()
                .by_participant_id()
                .filter(participant.id)
                .count()
                > 0
        });
    if !is_active_participants {
        let room = ctx
            .db
            .room()
            .id()
            .find(participant.room_id)
            .ok_or("Room not found")?;
        log::debug!(
            "No active participants left in room {}, scheduling deletion",
            room.code
        );
        schedule_delete_room(ctx, &room)?;
    }

    Ok(())
}

#[reducer]
pub fn join_room(ctx: &ReducerContext, code: String) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    let profile = ctx
        .db
        .profile()
        .identity()
        .find(ctx.sender())
        .ok_or("User has not yet created a profile")?;

    log::info!("Profile {} joining room {}", profile.identity, code);
    let room = ctx.db.room().code().find(&code).ok_or("Room not found")?;

    let participant = synchronize_participant_with_profile(ctx, &room, &profile)?;
    // Register participation
    if let Some(prev_participation) = ctx.db.participation().connection_id().find(connection_id) {
        unregister_participation(ctx, prev_participation, None)?;
    }
    log::trace!(
        "Registering participation for connection {} in room {}",
        connection_id,
        room.code
    );
    ctx.db.participation().insert(Participation {
        connection_id,
        participant_id: participant.id,
    });

    Ok(())
}

#[reducer]
pub fn create_profile(ctx: &ReducerContext, name: String, avatar: Avatar) -> Result<(), String> {
    log::info!("Creating profile for {}", ctx.sender());
    validate_profile_name(&name)?;
    match ctx.db.profile().try_insert(Profile {
        identity: ctx.sender(),
        name,
        avatar,
    }) {
        Ok(_) => Ok(()),
        Err(e) => match e {
            TryInsertError::UniqueConstraintViolation(e) => {
                Err(format!("User already has a profile: {}", e))
            }
            _ => panic!("{:?}", e),
        },
    }
}

#[reducer]
pub fn disconnect_current_room(ctx: &ReducerContext) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };
    log::info!(
        "Disconnecting current room for connection {}",
        connection_id
    );
    let Some(participation) = ctx.db.participation().connection_id().find(connection_id) else {
        log::debug!("Connection {} not in a room", connection_id);
        return Ok(());
    };
    unregister_participation(ctx, participation, None)?;
    Ok(())
}

#[reducer]
pub fn create_room(ctx: &ReducerContext) -> Result<(), String> {
    let profile = ctx
        .db
        .profile()
        .identity()
        .find(ctx.sender())
        .ok_or("User has not yet created a profile")?;

    log::info!("Creating room for profile {}", profile.identity);
    let room = loop {
        let code = generate_room_code(&mut ctx.rng());
        match ctx.db.room().try_insert(Room {
            id: 0,
            code,
            permanent: false,
            revealed: false,
            current_topic: "".to_string(),
            current_deck: default_deck(),
        }) {
            Err(TryInsertError::UniqueConstraintViolation(_)) => { /* Another try */ }
            result => break result.unwrap(),
        }
    };
    log::debug!("Created room {}", room.code);

    // Let active connection join this room
    join_room(ctx, room.code)?;

    Ok(())
}

#[reducer]
pub fn profile_set_name_avatar(
    ctx: &ReducerContext,
    name: Option<String>,
    avatar: Option<Avatar>,
) -> Result<(), String> {
    let mut profile = ctx
        .db
        .profile()
        .identity()
        .find(ctx.sender())
        .ok_or("User has not yet created a profile")?;
    if let Some(name) = name {
        validate_profile_name(&name)?;
        profile.name = name;
    }
    if let Some(avatar) = avatar {
        profile.avatar = avatar;
    }
    log::info!("Updating profile user {}", ctx.sender());
    let profile = ctx.db.profile().identity().update(profile);

    // Find all active rooms for this profile
    let participants = ctx.db.participant().by_identity().filter(profile.identity);
    for participant in participants {
        let Some(room) = ctx.db.room().id().find(participant.room_id) else {
            continue;
        };
        synchronize_participant_with_profile(ctx, &room, &profile)?;
    }

    Ok(())
}

#[reducer]
pub fn make_room_permanent(ctx: &ReducerContext) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!("Making room of connection {} permanent", connection_id);
    let participant = ensure_moderator_participant(ctx, connection_id)?;

    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    log::info!("Making room {} permanent", room.code);
    ctx.db.room().id().update(Room {
        permanent: true,
        ..room
    });

    Ok(())
}

pub fn ensure_moderator_participant(
    ctx: &ReducerContext,
    connection_id: ConnectionId,
) -> Result<Participant, String> {
    let participation = ctx
        .db
        .participation()
        .connection_id()
        .find(connection_id)
        .ok_or("Not in a room")?;
    let participant = ctx
        .db
        .participant()
        .id()
        .find(participation.participant_id)
        .ok_or("Participant not found")?;
    if participant.role != ParticipantRole::Moderator {
        return Err("Only moderators can set the room topic".to_string());
    }
    Ok(participant)
}

#[reducer]
pub fn set_room_topic(ctx: &ReducerContext, topic: String) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!("Setting room topic for connection {}", connection_id);
    let participant = ensure_moderator_participant(ctx, connection_id)?;

    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    log::info!("Setting new topic for room {}", room.code);
    ctx.db.room().id().update(Room {
        current_topic: topic,
        ..room
    });

    Ok(())
}

#[reducer]
pub fn set_room_deck(ctx: &ReducerContext, new_deck: Vec<DeckCard>) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!("Setting room deck for connection {}", connection_id);
    let participant = ensure_moderator_participant(ctx, connection_id)?;

    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    log::info!("Setting new deck for room {}", room.code);
    if room.current_deck == new_deck {
        log::trace!("New deck is the same as the current deck, no update needed");
        return Ok(());
    }

    ctx.db.room().id().update(Room {
        current_deck: new_deck,
        ..room
    });

    // Reset all current votes
    for participant in ctx.db.participant().by_room_id().filter(room.id) {
        if participant.role != ParticipantRole::Player {
            continue;
        }
        if ctx
            .db
            .ongoing_vote()
            .participant_id()
            .delete(participant.id)
        {
            log::trace!("Reseted vote for participant {}", participant.id);
        };
    }

    Ok(())
}

#[reducer]
pub fn vote_for_card(ctx: &ReducerContext, card_id: u64) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!(
        "Voting for card {} for connection {}",
        card_id,
        connection_id
    );
    let participation = ctx
        .db
        .participation()
        .connection_id()
        .find(connection_id)
        .ok_or("Not in a room")?;
    let participant = ctx
        .db
        .participant()
        .id()
        .find(participation.participant_id)
        .ok_or("Participant not found")?;
    if participant.role == ParticipantRole::Spectator {
        return Err("Spectators cannot vote".to_string());
    }
    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    if room.revealed {
        return Err("Room has already been revealed".to_string());
    }
    if !room.current_deck.iter().any(|card| card.id == card_id) {
        return Err("Card not found in deck".to_string());
    }
    if ctx
        .db
        .ongoing_vote()
        .participant_id()
        .find(participant.id)
        .is_some()
    {
        return Err("You have already voted".to_string());
    }
    log::info!("Player {} voting for card {}", participant.id, card_id);
    ctx.db.ongoing_vote().insert(OngoingVote {
        participant_id: participant.id,
        chosen_card_id: card_id,
    });
    Ok(())
}

#[reducer]
pub fn cancel_my_vote(ctx: &ReducerContext) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };
    log::debug!("Resetting vote for connection {}", connection_id);
    let participation = ctx
        .db
        .participation()
        .connection_id()
        .find(connection_id)
        .ok_or("Not in a room")?;
    let participant = ctx
        .db
        .participant()
        .id()
        .find(participation.participant_id)
        .ok_or("Participant not found")?;
    if participant.role == ParticipantRole::Spectator {
        return Err("Spectators cannot cancel their vote".to_string());
    }
    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    if room.revealed {
        return Err("Room has already been revealed, cannot change your votes now".to_string());
    }
    log::info!("Cancelling vote for participant {}", participant.id);
    if !ctx
        .db
        .ongoing_vote()
        .participant_id()
        .delete(participant.id)
    {
        log::debug!("No vote to cancel for participant {}", participant.id);
    }
    Ok(())
}

#[reducer]
pub fn reveal_room(ctx: &ReducerContext) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!("Revealing room for connection {}", connection_id);
    let participant = ensure_moderator_participant(ctx, connection_id)?;

    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    log::info!("Revealing room {}", room.code);
    let mut reveal_votes = vec![];
    let current_deck_map = room
        .current_deck
        .iter()
        .map(|card| (card.id, card))
        .collect::<FxHashMap<_, _>>();
    for participant in ctx.db.participant().by_room_id().filter(room.id) {
        if participant.role == ParticipantRole::Spectator || ctx.db.participation().by_participant_id().filter(participant.id).count() == 0 {
            continue;
        }
        log::trace!("Checking vote for participant {}", participant.id);
        match ctx.db.ongoing_vote().participant_id().find(participant.id) {
            None => return Err("Player has not voted".to_string()),
            Some(ongoing_vote) => {
                let card = current_deck_map
                    .get(&ongoing_vote.chosen_card_id)
                    .ok_or("Card not found")?;
                reveal_votes.push(RoomRevealVote {
                    participant_id: participant.id,
                    chosen_card_id: card.id,
                    chosen_card_symbol: card.symbol.clone(),
                });
            }
        }
    }
    let room = ctx.db.room().id().update(Room {
        revealed: true,
        ..room
    });

    // Add reveal outcome
    log::info!("Adding reveal outcome for room {}", room.code);
    ctx.db.room_reveal_outcome().insert(RoomRevealOutcome {
        id: 0,
        room_id: room.id,
        timestamp: ctx.timestamp,
        topic: room.current_topic,
        votes: reveal_votes,
    });

    Ok(())
}

#[reducer]
pub fn unreveal_room(ctx: &ReducerContext) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };
    log::debug!("Unrevealing room for connection {}", connection_id);
    let participant = ensure_moderator_participant(ctx, connection_id)?;

    let room = ctx
        .db
        .room()
        .id()
        .find(participant.room_id)
        .ok_or("Room not found")?;
    log::info!("Unrevealing room {}", room.code);
    let room = ctx.db.room().id().update(Room {
        revealed: false,
        ..room
    });

    // Clear all ongoing votes
    log::debug!("Clearing all ongoing votes for room {}", room.code);
    for participant in ctx.db.participant().by_room_id().filter(room.id) {
        if ctx
            .db
            .ongoing_vote()
            .participant_id()
            .delete(participant.id)
        {
            log::trace!("Reseted vote for participant {}", participant.id);
        };
    }

    Ok(())
}

#[reducer]
pub fn set_participant_role(
    ctx: &ReducerContext,
    identity: Identity,
    role: ParticipantRole,
) -> Result<(), String> {
    let Some(connection_id) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::debug!("Setting participant role for identity {}", identity);
    let participation = ctx
        .db
        .participation()
        .connection_id()
        .find(connection_id)
        .ok_or("Not in a room")?;
    let self_participant = ctx
        .db
        .participant()
        .id()
        .find(participation.participant_id)
        .ok_or("Invoker participant not found")?;
    let target_participant = ctx
        .db
        .participant()
        .by_identity_room_id()
        .filter((identity, self_participant.room_id))
        .next()
        .ok_or("Target participant not found")?;
    if self_participant.id != target_participant.id
        && self_participant.role != ParticipantRole::Moderator
    {
        return Err("Only moderators can set other participant's role".to_string());
    }
    log::info!(
        "Setting role for participant {} to {:?}",
        target_participant.id,
        role
    );
    let target_participant = ctx.db.participant().id().update(Participant {
        role,
        ..target_participant
    });

    // Reset the current vote if new_role is not Player
    if target_participant.role == ParticipantRole::Spectator {
        log::debug!("Resetting vote for participant {}", target_participant.id);
        if ctx
            .db
            .ongoing_vote()
            .participant_id()
            .delete(target_participant.id)
        {
            log::trace!("Reseted vote for participant {}", target_participant.id);
        };
    }

    Ok(())
}

#[reducer]
pub fn submit_feedback(ctx: &ReducerContext, feedback: String) -> Result<(), String> {
    let Some(_) = ctx.connection_id() else {
        return Err("Not connected".to_string());
    };

    log::info!("Received feedback from {}", ctx.sender());
    let trimmed_feedback = feedback.trim();
    validate_feedback(trimmed_feedback)?;

    ctx.db.feedback().insert(Feedback {
        id: 0,
        text: trimmed_feedback.to_string(),
        submitter_identity: ctx.sender(),
        timestamp: ctx.timestamp,
    });

    Ok(())
}
