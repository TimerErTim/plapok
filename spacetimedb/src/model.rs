use spacetimedb::{
    AnonymousViewContext, ConnectionId, Identity, ScheduleAt, SpacetimeType, Timestamp, ViewContext, table, view
};

use crate::use_cases::handle_delete_room;

// Tables

#[table(accessor = profile, private)]
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
    FromIdentity
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
}

#[derive(SpacetimeType, Clone, Debug, PartialEq)]
pub enum ParticipantRole {
    Moderator,
    Player,
    Spectator,
}

#[table(accessor = participant, private,
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

#[table(accessor = room_reveal_outcome, private)]
pub struct RoomRevealOutcome {
    #[primary_key]
    pub room_id: u64,
    pub timestamp: Timestamp,
    pub votes: Vec<RoomRevealVote>,
}

#[derive(SpacetimeType)]
pub struct RoomRevealVote {
    pub participant_id: u64,
    pub participant_name: String,
    pub chosen_card_id: String,
    pub chosen_card_name: String,
}

#[table(accessor = ongoing_vote, private,
    index(accessor = by_room_id, btree(columns = [room_id])),
    index(accessor = by_participant_id, btree(columns = [participant_id]))
)]
pub struct OngoingVote {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub room_id: u64,
    pub participant_id: u64,
    pub chosen_card: String,
}

// Views
#[view(accessor = my_profile, public)]
pub fn my_profile(ctx: &ViewContext) -> Option<Profile> {
    ctx.db.profile().identity().find(ctx.sender())
}
