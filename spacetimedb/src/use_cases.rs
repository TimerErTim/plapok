use std::time::Duration;

use fxhash::FxHashMap;
use rand::Rng;
use spacetimedb::{
    ConnectionId, DbContext, ReducerContext, ScheduleAt, Table, TryInsertError, rand, reducer,
    spacetimedb_lib::connection_id,
};

use crate::{
    model::{
        Avatar, DeleteRoom, Participant, ParticipantRole, Participation, Profile, Room,
        delete_room, ongoing_vote, participant, participation, profile, room,
        room_reveal_outcome,
    },
    tweaks::{get_deletion_time, validate_profile_name},
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
        .find(&row.room_id)
        .ok_or("Room not found")?;
    log::info!("Deleting room {}", room.code);
    if ctx.db.room().id().delete(room.id) {
        log::warn!("Room {} was already deleted", room.code);
    }

    let deleted_particip_count = ctx.db.participant().by_room_id().delete(room.id);
    log::debug!(
        "Deleted {} participants from room {}",
        deleted_particip_count,
        room.code
    );

    let deleted_votes_count = ctx.db.ongoing_vote().by_room_id().delete(room.id);
    log::debug!(
        "Deleted {} votes from room {}",
        deleted_votes_count,
        room.code
    );

    let deleted_reveal_outcome_count = ctx.db.room_reveal_outcome().room_id().delete(room.id);
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
        connection_id: connection_id,
        participant_id: participant.id,
    });

    Ok(())
}

#[reducer]
pub fn create_profile(ctx: &ReducerContext, name: String, avatar: Avatar) -> Result<(), String> {
    match ctx.db.profile().try_insert(Profile {
        identity: ctx.sender(),
        name: name,
        avatar: avatar,
    }) {
        Ok(_) => Ok(()),
        Err(e) => match e {
            TryInsertError::UniqueConstraintViolation(e) => {
                Err(format!("User already has a profile: {}", e))
            }
            _ => Err(e).unwrap(),
        },
    }
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
pub fn profile_set_name_avatar(ctx: &ReducerContext, name: Option<String>, avatar: Option<Avatar>) -> Result<(), String> {
    let mut profile = ctx.db.profile().identity().find(ctx.sender()).ok_or("User has not yet created a profile")?;
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

    let participation = ctx.db.participation().connection_id().find(connection_id).ok_or("Not in a room")?;
    let participant = ctx.db.participant().id().find(participation.participant_id).ok_or("Participant not found")?;
    if participant.role != ParticipantRole::Moderator {
        return Err("Only moderators can make a room permanent".to_string());
    }
    
    let room = ctx.db.room().id().find(participant.room_id).ok_or("Room not found")?;
    log::info!("Making room {} permanent", room.code);
    ctx.db.room().id().update(Room {
        permanent: true,
        ..room
    });

    Ok(())
}
