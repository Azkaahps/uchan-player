pub mod application;
pub mod domain;
pub mod infrastructure;
pub mod ipc;

use application::{LibraryService, PlaybackService, ProviderService};
use infrastructure::audio::AudioEngine;
use infrastructure::database::Database;
use ipc::commands::*;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("uchan-player");
    let db_path = data_dir.join("library.db");

    let db = Arc::new(Database::new(&db_path).expect("Failed to initialize database"));
    let audio_engine = Arc::new(AudioEngine::new().expect("Failed to initialize audio engine"));

    let library_service = Arc::new(LibraryService::new(db.clone()));
    let provider_service = Arc::new(ProviderService::new());
    let playback_service = Arc::new(PlaybackService::new(audio_engine, db));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            playback: playback_service,
        })
        .manage(LibraryState {
            library: library_service,
        })
        .manage(ProviderState {
            provider: provider_service,
        })
        .invoke_handler(tauri::generate_handler![
            toggle_playback,
            pause_playback,
            resume_playback,
            seek_playback,
            next_track,
            previous_track,
            set_volume,
            get_playback_status,
            get_queue,
            play_queue_index,
            remove_from_queue,
            set_shuffle,
            set_repeat,
            scan_local_folder,
            get_library_tracks,
            get_library_albums,
            play_track_by_id,
            search_youtube_music,
            play_youtube_track,
            get_app_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
