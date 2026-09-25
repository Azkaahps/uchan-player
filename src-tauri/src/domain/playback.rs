use crate::domain::track::TrackId;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlaybackState {
    Idle,
    Loading,
    Playing,
    Paused,
    Buffering,
    Retrying,
    Seeking,
    Ended,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RepeatMode {
    Off,
    All,
    One,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlaybackCommand {
    Play,
    Pause,
    Toggle,
    Seek(Duration),
    Next,
    Previous,
    PlayIndex(usize),
    SetQueue(Vec<TrackId>),
    AddToQueue(TrackId),
    RemoveFromQueue(usize),
    MoveQueue { from: usize, to: usize },
    SetShuffle(bool),
    SetRepeat(RepeatMode),
    SetVolume(f32),
}
