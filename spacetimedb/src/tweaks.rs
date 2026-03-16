use std::time::Duration;

use spacetimedb::Timestamp;

use crate::model::{DeckCard, Room};

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

pub fn default_deck() -> Vec<DeckCard> {
    // TODO: implement room creation time deck specification
    let symbols = vec![
        // Fibonacci Planning Poker symbols commonly used:
        // ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?", "∞", "☕"]
        "½".to_string(),
        "1".to_string(),
        "2".to_string(),
        "3".to_string(),
        "5".to_string(),
        "8".to_string(),
        "13".to_string(),
        "21".to_string(),
        "?".to_string(),
        "∞".to_string(),
        "☕".to_string(),
    ];
    
    symbols.into_iter().enumerate().map(|(i, symbol)| DeckCard { id: i as u64 + 1, symbol }).collect()
}

pub fn validate_feedback(feedback: &str) -> Result<(), String> {
    if feedback.len() > 1000 {
        return Err("Feedback must be less than 1000 characters".to_string());
    }
    Ok(())
}
