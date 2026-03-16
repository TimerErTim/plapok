use rustc_hash::FxHashMap;
use spacetimedb::{
    ConnectionId, Identity, ScheduleAt, SpacetimeType, Timestamp,
    ViewContext, table, view,
};

use crate::use_cases::handle_delete_room;

// Tables

#[table(accessor = profile, private)]
#[derive(Clone)]
pub struct Profile {
    #[primary_key]
    pub identity: Identity,
    pub name: String,
    pub avatar: Avatar,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum Avatar {
    Alice,
    Bob,
    Charlie,
    Diana,
    Eve,
    Frank,
    Grace,
    Henry,
    Ivy,
    Jack,
    Karen,
    Leo,
    Maria,
    Nora,
    Oscar,
    Paul,
    Quinn,
    Ruby,
    Steve,
    Tina,
    FromName,
    FromIdentity,
}

#[table(accessor = room, private,
    index(accessor = by_code, btree(columns = [code])),
)]
pub struct Room {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[unique]
    pub code: String,
    pub permanent: bool, // If true, room is permanent and will not be deleted upon last participant leaving
    pub current_topic: String,
    pub revealed: bool,
    pub current_deck: Vec<DeckCard>,
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum ParticipantRole {
    Moderator,
    Player,
    Spectator,
}

#[table(accessor = participant, private,
    index(accessor = by_identity, btree(columns = [identity])),
    index(accessor = by_room_id, btree(columns = [room_id])),
    index(accessor = by_identity_room_id, btree(columns = [identity, room_id]))
)]
#[derive(Clone)]
pub struct Participant {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub identity: Identity,
    pub room_id: u64,
    pub name: String,
    pub avatar: Avatar,
    #[default(ParticipantRole::Player)]
    pub role: ParticipantRole,
}

/// Represents an actual connection/participation to a room
#[table(accessor = participation, private,
    index(accessor = by_participant_id, btree(columns = [participant_id]))
)]
pub struct Participation {
    #[primary_key]
    pub connection_id: ConnectionId,
    pub participant_id: u64,
}

#[table(accessor = delete_room, private, scheduled(handle_delete_room))]
pub struct DeleteRoom {
    #[primary_key]
    pub room_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[table(accessor = room_reveal_outcome, private,
    index(accessor = by_room_id, btree(columns = [room_id]))
)]
pub struct RoomRevealOutcome {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub room_id: u64,
    pub timestamp: Timestamp,
    pub topic: String,
    pub votes: Vec<RoomRevealVote>,
}

#[derive(SpacetimeType)]
pub struct RoomRevealVote {
    pub participant_id: u64,
    pub chosen_card_id: u64,
    pub chosen_card_symbol: String,
}

#[table(accessor = ongoing_vote, private,
    index(accessor = by_participant_id, btree(columns = [participant_id]))
)]
pub struct OngoingVote {
    #[primary_key]
    pub participant_id: u64,
    pub chosen_card_id: u64,
}

#[table(accessor = feedback, private)]
pub struct Feedback {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub submitter_identity: Identity,
    pub text: String,
    pub timestamp: Timestamp,
}

// -----
// Views
#[view(accessor = my_profile, public)]
pub fn my_profile(ctx: &ViewContext) -> Option<Profile> {
    ctx.db.profile().identity().find(ctx.sender())
}

#[derive(SpacetimeType)]
pub struct RoomView {
    pub code: String,
    pub permanent: bool,
    pub current_topic: String,
    pub current_deck: Vec<DeckCard>,
    pub participants: Vec<ParticipantView>,
    pub vote_history: Vec<VoteResultRecordView>,
    pub my_connections: Vec<ConnectionId>,
}

#[derive(SpacetimeType)]
pub struct VoteResultRecordView {
    pub timestamp: Timestamp,
    pub topic: String,
    pub votes: Vec<RevealedVoteRecordView>,
}

#[derive(SpacetimeType)]
pub struct RevealedVoteRecordView {
    pub profile: Profile,
    pub chosen_card_id: u64,
    pub chosen_card_symbol: String,
}

#[derive(SpacetimeType)]
pub struct ParticipantView {
    pub profile: Profile,
    pub role: ParticipantRole,
    pub vote_state: VoteStateView,
}


#[derive(SpacetimeType)]
pub enum VoteStateView {
    NotVoted,
    Voted,
    Revealed(DeckCard),
}

#[derive(SpacetimeType, Clone, PartialEq)]
pub struct DeckCard {
    pub id: u64,
    pub symbol: String,
}

#[view(accessor = my_participating_rooms, public)]
pub fn my_participating_rooms(ctx: &ViewContext) -> Vec<RoomView> {
    let mut all_rooms = FxHashMap::default();
    let mut all_profiles = FxHashMap::default();
    for participant in ctx.db.participant().by_identity().filter(ctx.sender()) {
        for active_participation in ctx
            .db
            .participation()
            .by_participant_id()
            .filter(participant.id)
        {
            let room = all_rooms.entry(participant.room_id).or_insert_with(|| {
                let room = ctx.db.room().id().find(participant.room_id).unwrap();
                let deck_cards_map: FxHashMap<_, _> = room.current_deck.iter().map(|card| (card.id, card)).collect();
                
                // Find all participants in the room
                let room_participants: FxHashMap<_, _> = ctx.db.participant().by_room_id().filter(participant.room_id).map(|participant| (participant.id, participant)).collect();

                // Find vote history
                let vote_history = ctx.db.room_reveal_outcome().by_room_id().filter(participant.room_id).map(|reveal| VoteResultRecordView {
                    timestamp: reveal.timestamp,
                    topic: reveal.topic,
                    votes: reveal.votes.into_iter().map(|vote| RevealedVoteRecordView {
                        profile: all_profiles.entry(vote.participant_id).or_insert_with(|| {
                            let participant = room_participants.get(&vote.participant_id).unwrap();
                            ctx.db.profile().identity().find(participant.identity).unwrap()
                        }).clone(),
                        chosen_card_id: vote.chosen_card_id,
                        chosen_card_symbol: vote.chosen_card_symbol,
                    }).collect(),
                }).collect();

                // Find all active participants in the room
                let all_active_participants = room_participants.into_values().filter(|participant| ctx.db.participation().by_participant_id().filter(participant.id).count() > 0);
                RoomView {
                    code: room.code,
                    permanent: room.permanent,
                    current_topic: room.current_topic,
                    participants: all_active_participants.map(|participant| ParticipantView {
                        profile: all_profiles.entry(participant.id).or_insert_with(|| {
                            ctx.db.profile().identity().find(participant.identity).unwrap()
                        }).clone(),
                        role: participant.role,
                        vote_state: match ctx.db.ongoing_vote().participant_id().find(participant.id) {
                            None => VoteStateView::NotVoted,
                            Some(ongoing_vote) => if room.revealed {
                                VoteStateView::Revealed(deck_cards_map.get(&ongoing_vote.chosen_card_id).unwrap().to_owned().clone())
                            } else {
                                VoteStateView::Voted
                            },
                        },
                    }).collect(),
                    current_deck: room.current_deck,
                    vote_history,
                    my_connections: vec![],
                }
            });
            room.my_connections.push(active_participation.connection_id);
        }
    }
    all_rooms.into_values().collect()
}
