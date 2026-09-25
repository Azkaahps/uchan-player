use super::playback::AppState;
use crate::application::{track_to_dto, LibraryService};
use crate::domain::track::TrackId;
use crate::ipc::dto::{AlbumDto, PlaybackStatusDto, TrackDto};
use std::path::Path;
use std::sync::Arc;
use tauri::State;

pub struct LibraryState {
    pub library: Arc<LibraryService>,
}

#[tauri::command]
pub fn scan_local_folder(
    lib_state: State<'_, LibraryState>,
    path: String,
) -> Result<usize, String> {
    let p = Path::new(&path);
    lib_state
        .library
        .scan_directory(p)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_library_tracks(lib_state: State<'_, LibraryState>) -> Result<Vec<TrackDto>, String> {
    let tracks = lib_state.library.get_tracks().map_err(|e| e.to_string())?;
    Ok(tracks.iter().map(track_to_dto).collect())
}

#[tauri::command]
pub fn get_library_albums(lib_state: State<'_, LibraryState>) -> Result<Vec<AlbumDto>, String> {
    let albums = lib_state.library.get_albums().map_err(|e| e.to_string())?;
    Ok(albums
        .into_iter()
        .map(|a| AlbumDto {
            id: a.id,
            title: a.title,
            artist: a.artist,
            year: a.year,
            track_count: a.track_count,
            artwork_path: a.artwork_path,
        })
        .collect())
}

#[tauri::command]
pub fn play_track_by_id(
    app_state: State<'_, AppState>,
    lib_state: State<'_, LibraryState>,
    track_id: String,
) -> Result<PlaybackStatusDto, String> {
    let tracks = lib_state.library.get_tracks().map_err(|e| e.to_string())?;
    if let Some(track) = tracks
        .into_iter()
        .find(|t| t.id == TrackId(track_id.clone()))
    {
        app_state
            .playback
            .play_track(track)
            .map_err(|e| e.to_string())?;
        Ok(app_state.playback.get_playback_status())
    } else {
        Err(format!("Track with id '{}' not found", track_id))
    }
}
