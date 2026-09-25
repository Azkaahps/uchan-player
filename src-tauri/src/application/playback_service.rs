use crate::domain::playback::{PlaybackState, RepeatMode};
use crate::domain::queue::{QueueItem, QueueState};
use crate::domain::track::{Track, TrackId, TrackSource};
use crate::infrastructure::audio::AudioEngine;
use crate::infrastructure::database::Database;
use crate::ipc::dto::{PlaybackStatusDto, QueueItemDto, QueueStateDto, TrackDto};
use anyhow::{anyhow, Result};
use parking_lot::Mutex;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

pub struct PlaybackService {
    audio_engine: Arc<AudioEngine>,
    queue: Arc<Mutex<QueueState>>,
    current_track: Arc<Mutex<Option<Track>>>,
    playback_state: Arc<Mutex<PlaybackState>>,
    tracks_cache: Arc<Mutex<HashMap<TrackId, Track>>>,
    db: Arc<Database>,
}

impl PlaybackService {
    pub fn new(audio_engine: Arc<AudioEngine>, db: Arc<Database>) -> Self {
        Self {
            audio_engine,
            queue: Arc::new(Mutex::new(QueueState::default())),
            current_track: Arc::new(Mutex::new(None)),
            playback_state: Arc::new(Mutex::new(PlaybackState::Idle)),
            tracks_cache: Arc::new(Mutex::new(HashMap::new())),
            db,
        }
    }

    pub fn play_track(&self, track: Track) -> Result<()> {
        let mut cache = self.tracks_cache.lock();
        cache.insert(track.id.clone(), track.clone());
        drop(cache);

        match &track.source {
            TrackSource::Local { path } => {
                if !path.exists() {
                    *self.playback_state.lock() = PlaybackState::Error;
                    return Err(anyhow!("File does not exist: {}", path.display()));
                }
                *self.playback_state.lock() = PlaybackState::Loading;
                self.audio_engine.play_file(path)?;
                *self.current_track.lock() = Some(track);
                *self.playback_state.lock() = PlaybackState::Playing;
                Ok(())
            }
            TrackSource::Remote { .. } => {
                *self.playback_state.lock() = PlaybackState::Buffering;
                Err(anyhow!("Remote tracks must be downloaded before playback"))
            }
        }
    }

    pub fn toggle_playback(&self) -> PlaybackState {
        let current_state = *self.playback_state.lock();
        if current_state == PlaybackState::Idle {
            if let Some(track) = self.get_current_or_first_track() {
                let _ = self.play_track(track);
                return *self.playback_state.lock();
            }
        }

        let is_playing = self.audio_engine.toggle();
        let new_state = if is_playing {
            PlaybackState::Playing
        } else {
            PlaybackState::Paused
        };
        *self.playback_state.lock() = new_state;
        new_state
    }

    pub fn pause(&self) {
        self.audio_engine.pause();
        *self.playback_state.lock() = PlaybackState::Paused;
    }

    pub fn resume(&self) {
        self.audio_engine.resume();
        *self.playback_state.lock() = PlaybackState::Playing;
    }

    pub fn seek(&self, position: Duration) -> Result<()> {
        self.audio_engine.seek(position)?;
        Ok(())
    }

    pub fn set_volume(&self, volume: f32) {
        self.audio_engine.set_volume(volume);
    }

    pub fn get_volume(&self) -> f32 {
        self.audio_engine.get_volume()
    }

    pub fn set_queue(&self, tracks: Vec<Track>) {
        let mut queue = self.queue.lock();
        let mut cache = self.tracks_cache.lock();

        let mut items = Vec::new();
        for track in tracks {
            cache.insert(track.id.clone(), track.clone());
            items.push(QueueItem {
                id: Uuid::new_v4().to_string(),
                track_id: track.id,
            });
        }

        queue.items = items;
        queue.current_index = if queue.items.is_empty() {
            None
        } else {
            Some(0)
        };
        queue.revision += 1;
    }

    pub fn add_to_queue(&self, track: Track) {
        let mut queue = self.queue.lock();
        let mut cache = self.tracks_cache.lock();

        cache.insert(track.id.clone(), track.clone());
        let item = QueueItem {
            id: Uuid::new_v4().to_string(),
            track_id: track.id,
        };
        queue.items.push(item);
        if queue.current_index.is_none() {
            queue.current_index = Some(0);
        }
        queue.revision += 1;
    }

    pub fn remove_from_queue(&self, index: usize) {
        let mut queue = self.queue.lock();
        if index < queue.items.len() {
            queue.items.remove(index);
            if let Some(cur) = queue.current_index {
                if cur >= queue.items.len() {
                    queue.current_index = if queue.items.is_empty() {
                        None
                    } else {
                        Some(queue.items.len() - 1)
                    };
                }
            }
            queue.revision += 1;
        }
    }

    pub fn play_index(&self, index: usize) -> Result<()> {
        let mut queue = self.queue.lock();
        if index < queue.items.len() {
            queue.current_index = Some(index);
            let track_id = queue.items[index].track_id.clone();
            drop(queue);

            if let Some(track) = self.get_track(&track_id) {
                return self.play_track(track);
            }
        }
        Err(anyhow!("Invalid queue index"))
    }

    pub fn next(&self) -> Result<()> {
        let mut queue = self.queue.lock();
        if queue.items.is_empty() {
            return Ok(());
        }

        let next_idx = match queue.current_index {
            Some(idx) => {
                if idx + 1 < queue.items.len() {
                    idx + 1
                } else if queue.repeat_mode == RepeatMode::All {
                    0
                } else {
                    return Ok(());
                }
            }
            None => 0,
        };

        queue.current_index = Some(next_idx);
        let track_id = queue.items[next_idx].track_id.clone();
        drop(queue);

        if let Some(track) = self.get_track(&track_id) {
            self.play_track(track)?;
        }
        Ok(())
    }

    pub fn previous(&self) -> Result<()> {
        let mut queue = self.queue.lock();
        if queue.items.is_empty() {
            return Ok(());
        }

        let pos = self.audio_engine.get_position();
        if pos.as_secs() > 3 {
            drop(queue);
            let _ = self.audio_engine.seek(Duration::ZERO);
            return Ok(());
        }

        let prev_idx = match queue.current_index {
            Some(idx) => {
                if idx > 0 {
                    idx - 1
                } else if queue.repeat_mode == RepeatMode::All {
                    queue.items.len() - 1
                } else {
                    0
                }
            }
            None => 0,
        };

        queue.current_index = Some(prev_idx);
        let track_id = queue.items[prev_idx].track_id.clone();
        drop(queue);

        if let Some(track) = self.get_track(&track_id) {
            self.play_track(track)?;
        }
        Ok(())
    }

    pub fn set_shuffle(&self, shuffle: bool) {
        let mut queue = self.queue.lock();
        queue.shuffle_mode = shuffle;
        queue.revision += 1;
    }

    pub fn set_repeat(&self, repeat: RepeatMode) {
        let mut queue = self.queue.lock();
        queue.repeat_mode = repeat;
        queue.revision += 1;
    }

    fn get_track(&self, track_id: &TrackId) -> Option<Track> {
        if let Some(t) = self.tracks_cache.lock().get(track_id).cloned() {
            return Some(t);
        }
        self.db.get_track_by_id(&track_id.0).ok().flatten()
    }

    fn get_current_or_first_track(&self) -> Option<Track> {
        let queue = self.queue.lock();
        if let Some(idx) = queue.current_index {
            if let Some(item) = queue.items.get(idx) {
                let tid = item.track_id.clone();
                drop(queue);
                return self.get_track(&tid);
            }
        }
        None
    }

    pub fn get_playback_status(&self) -> PlaybackStatusDto {
        let state = *self.playback_state.lock();
        let track = self.current_track.lock().as_ref().map(track_to_dto);
        let pos = self.audio_engine.get_position();
        let vol = self.audio_engine.get_volume();

        let duration_ms = track.as_ref().map(|t| t.duration_ms).unwrap_or(0);

        let state_str = match state {
            PlaybackState::Idle => "idle",
            PlaybackState::Loading => "loading",
            PlaybackState::Playing => "playing",
            PlaybackState::Paused => "paused",
            PlaybackState::Buffering => "buffering",
            PlaybackState::Retrying => "retrying",
            PlaybackState::Seeking => "seeking",
            PlaybackState::Ended => "ended",
            PlaybackState::Error => "error",
        };

        PlaybackStatusDto {
            state: state_str.to_string(),
            current_track: track,
            position_ms: pos.as_millis() as u64,
            duration_ms,
            volume: vol,
            error_message: None,
        }
    }

    pub fn get_queue_status(&self) -> QueueStateDto {
        let queue = self.queue.lock();
        let cache = self.tracks_cache.lock();

        let mut item_dtos = Vec::new();
        for item in &queue.items {
            let track = cache
                .get(&item.track_id)
                .cloned()
                .or_else(|| self.db.get_track_by_id(&item.track_id.0).ok().flatten())
                .map(|t| track_to_dto(&t))
                .unwrap_or_else(|| TrackDto {
                    id: item.track_id.0.clone(),
                    title: "Unknown Track".to_string(),
                    artist: "Unknown Artist".to_string(),
                    album: None,
                    duration_ms: 0,
                    artwork_url: None,
                    source_type: "unknown".to_string(),
                });

            item_dtos.push(QueueItemDto {
                id: item.id.clone(),
                track,
            });
        }

        let repeat_str = match queue.repeat_mode {
            RepeatMode::Off => "off",
            RepeatMode::All => "all",
            RepeatMode::One => "one",
        };

        QueueStateDto {
            items: item_dtos,
            current_index: queue.current_index,
            shuffle_mode: queue.shuffle_mode,
            repeat_mode: repeat_str.to_string(),
            revision: queue.revision,
        }
    }
}

pub fn track_to_dto(track: &Track) -> TrackDto {
    let source_type = match &track.source {
        TrackSource::Local { .. } => "local",
        TrackSource::Remote { .. } => "youtube",
    };

    TrackDto {
        id: track.id.0.clone(),
        title: track.metadata.title.clone(),
        artist: track.metadata.artist.clone(),
        album: track.metadata.album.clone(),
        duration_ms: track.metadata.duration.as_millis() as u64,
        artwork_url: track
            .metadata
            .artwork_path
            .clone()
            .or_else(|| track.metadata.artwork_url.clone()),
        source_type: source_type.to_string(),
    }
}
