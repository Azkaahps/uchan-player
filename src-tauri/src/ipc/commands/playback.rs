use crate::application::PlaybackService;
use crate::domain::track::TrackId;
use crate::ipc::dto::PlaybackStatusDto;
use std::sync::Arc;
use std::time::Duration;
use tauri::State;

pub struct AppState {
    pub playback: Arc<PlaybackService>,
}

#[tauri::command]
pub fn toggle_playback(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    state.playback.toggle_playback();
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn pause_playback(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    state.playback.pause();
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn resume_playback(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    state.playback.resume();
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn seek_playback(
    state: State<'_, AppState>,
    position_ms: u64,
) -> Result<PlaybackStatusDto, String> {
    state
        .playback
        .seek(Duration::from_millis(position_ms))
        .map_err(|e| e.to_string())?;
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn next_track(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    state.playback.next().map_err(|e| e.to_string())?;
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn previous_track(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    state.playback.previous().map_err(|e| e.to_string())?;
    Ok(state.playback.get_playback_status())
}

#[tauri::command]
pub fn set_volume(state: State<'_, AppState>, volume: f32) -> Result<f32, String> {
    state.playback.set_volume(volume);
    Ok(state.playback.get_volume())
}

#[tauri::command]
pub fn get_playback_status(state: State<'_, AppState>) -> Result<PlaybackStatusDto, String> {
    Ok(state.playback.get_playback_status())
}
