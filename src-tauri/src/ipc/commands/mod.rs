pub mod library;
pub mod playback;
pub mod provider;
pub mod queue;
pub mod settings;

pub use library::{
    get_library_albums, get_library_tracks, play_track_by_id, scan_local_folder, LibraryState,
};
pub use playback::{
    get_playback_status, next_track, pause_playback, previous_track, resume_playback,
    seek_playback, set_volume, toggle_playback, AppState,
};
pub use provider::{play_youtube_track, search_youtube_music, ProviderState};
pub use queue::{
    get_queue, play_queue_index, remove_from_queue, set_repeat, set_shuffle,
};
pub use settings::get_app_info;
