use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EphemeralStream {
    pub url: String,
    pub format: String,
    pub bitrate_kbps: Option<u32>,
    pub ttl: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub provider: String,
    pub remote_id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration_seconds: u64,
    pub thumbnail_url: Option<String>,
}
