use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackDto {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration_ms: u64,
    pub artwork_url: Option<String>,
    pub source_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItemDto {
    pub id: String,
    pub track: TrackDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueStateDto {
    pub items: Vec<QueueItemDto>,
    pub current_index: Option<usize>,
    pub shuffle_mode: bool,
    pub repeat_mode: String,
    pub revision: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackStatusDto {
    pub state: String,
    pub current_track: Option<TrackDto>,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub volume: f32,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlbumDto {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub year: Option<u32>,
    pub track_count: usize,
    pub artwork_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultDto {
    pub provider: String,
    pub remote_id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration_ms: u64,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfoDto {
    pub name: String,
    pub version: String,
    pub author: String,
    pub credit: String,
}
