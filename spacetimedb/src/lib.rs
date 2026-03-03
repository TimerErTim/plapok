use std::time::Duration;

use spacetimedb::{
    Identity, ReducerContext, ScheduleAt, SpacetimeType, Table, Timestamp, ViewContext, reducer,
    table, view,
};

use crate::{model::{participation, room}, use_cases::unregister_participation};

mod tweaks;
mod model;
mod use_cases;

const ROOT_BOOK_ID: u64 = 1;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    // Nothing to do
}

#[reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) -> Result<(), String> {
    log::info!("Client connected {}", ctx.sender());
    Ok(())
}

#[reducer(client_disconnected)]
pub fn identity_disconnected(ctx: &ReducerContext) -> Result<(), String> {
    log::info!("Client disconnected {}", ctx.sender());

    let Some(connection_id) = ctx.connection_id() else {
        log::warn!("Client disconnected but has no connection");
        return Ok(());
    };

    // Unregister participation
    if let Some(participation) = ctx.db.participation().connection_id().find(connection_id) {
        unregister_participation(ctx, participation, None)?;
    }

    Ok(())
}
