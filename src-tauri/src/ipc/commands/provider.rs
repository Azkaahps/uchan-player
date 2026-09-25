use super::playback::AppState;
use crate::application::ProviderService;
use crate::ipc::dto::{PlaybackStatusDto, SearchResultDto};
use std::sync::Arc;
use tauri::State;

pub struct ProviderState {
    pub provider: Arc<ProviderService>,
}

#[tauri::command]
pub async fn search_youtube_music(
    state: State<'_, ProviderState>,
    query: String,
) -> Result<Vec<SearchResultDto>, String> {
    let results = state
        .provider
        .search_youtube(&query)
        .await
        .map_err(|e| e.to_string())?;

    Ok(results
        .into_iter()
        .map(|r| SearchResultDto {
            provider: r.provider,
            remote_id: r.remote_id,
            title: r.title,
            artist: r.artist,
            album: r.album,
            duration_ms: r.duration_seconds * 1000,
            thumbnail_url: r.thumbnail_url,
        })
        .collect())
}

#[tauri::command]
pub async fn play_youtube_track(
    app_state: State<'_, AppState>,
    prov_state: State<'_, ProviderState>,
    remote_id: String,
    title: String,
    artist: String,
) -> Result<PlaybackStatusDto, String> {
    let track = prov_state
        .provider
        .prepare_remote_track(&remote_id, &title, &artist)
        .await
        .map_err(|e| e.to_string())?;

    app_state
        .playback
        .play_track(track)
        .map_err(|e| e.to_string())?;

    Ok(app_state.playback.get_playback_status())
}
