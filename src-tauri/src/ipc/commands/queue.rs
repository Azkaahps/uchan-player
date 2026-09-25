use super::playback::AppState;
use crate::domain::playback::RepeatMode;
use crate::ipc::dto::QueueStateDto;
use tauri::State;

#[tauri::command]
pub fn get_queue(state: State<'_, AppState>) -> Result<QueueStateDto, String> {
    Ok(state.playback.get_queue_status())
}

#[tauri::command]
pub fn play_queue_index(state: State<'_, AppState>, index: usize) -> Result<QueueStateDto, String> {
    state
        .playback
        .play_index(index)
        .map_err(|e| e.to_string())?;
    Ok(state.playback.get_queue_status())
}

#[tauri::command]
pub fn remove_from_queue(
    state: State<'_, AppState>,
    index: usize,
) -> Result<QueueStateDto, String> {
    state.playback.remove_from_queue(index);
    Ok(state.playback.get_queue_status())
}

#[tauri::command]
pub fn set_shuffle(state: State<'_, AppState>, shuffle: bool) -> Result<QueueStateDto, String> {
    state.playback.set_shuffle(shuffle);
    Ok(state.playback.get_queue_status())
}

#[tauri::command]
pub fn set_repeat(state: State<'_, AppState>, mode: String) -> Result<QueueStateDto, String> {
    let repeat = match mode.to_lowercase().as_str() {
        "all" => RepeatMode::All,
        "one" => RepeatMode::One,
        _ => RepeatMode::Off,
    };
    state.playback.set_repeat(repeat);
    Ok(state.playback.get_queue_status())
}
