use crate::domain::playback::RepeatMode;
use crate::domain::track::TrackId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: String,
    pub track_id: TrackId,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueState {
    pub items: Vec<QueueItem>,
    pub current_index: Option<usize>,
    pub shuffle_mode: bool,
    pub repeat_mode: RepeatMode,
    pub history: Vec<usize>,
    pub revision: u64,
}

impl Default for QueueState {
    fn default() -> Self {
        Self {
            items: Vec::new(),
            current_index: None,
            shuffle_mode: false,
            repeat_mode: RepeatMode::Off,
            history: Vec::new(),
            revision: 0,
        }
    }
}
