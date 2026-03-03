use std::time::Duration;

use spacetimedb::{ScheduleAt, Timestamp};

use crate::model::Room;

pub fn get_deletion_time(current_time: Timestamp, room: &Room) -> Timestamp {
    match room.permanent {
        true => current_time + Duration::from_hours(24 * 30 * 6), // 6 months
        false => current_time + Duration::from_hours(24), // 1 day after last disconnect
    }
}