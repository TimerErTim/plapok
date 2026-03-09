use std::time::Duration;

use spacetimedb::{ScheduleAt, Timestamp};

use crate::model::Room;

pub fn get_deletion_time(current_time: Timestamp, room: &Room) -> Timestamp {
    match room.permanent {
        true => current_time + Duration::from_hours(24 * 30 * 6), // 6 months
        false => current_time + Duration::from_hours(24), // 1 day after last disconnect
    }
}

pub fn validate_profile_name(name: &str) -> Result<(), String> {
    if name.len() < 2 || name.len() > 20 {
        return Err("Name must be between 2 and 20 characters".to_string());
    }
    Ok(())
}
