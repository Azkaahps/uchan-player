use crate::domain::provider::SearchResult;
use crate::domain::track::{Track, TrackId, TrackMetadata, TrackSource};
use crate::infrastructure::providers::YouTubeProvider;
use anyhow::{anyhow, Result};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

pub struct ProviderService {
    yt_provider: Arc<YouTubeProvider>,
    cache_dir: PathBuf,
}

impl Default for ProviderService {
    fn default() -> Self {
        Self::new()
    }
}

impl ProviderService {
    pub fn new() -> Self {
        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(std::env::temp_dir)
            .join("uchan-player")
            .join("streams");
        let _ = std::fs::create_dir_all(&cache_dir);

        Self {
            yt_provider: Arc::new(YouTubeProvider::new()),
            cache_dir,
        }
    }

    pub async fn search_youtube(&self, query: &str) -> Result<Vec<SearchResult>> {
        self.yt_provider.search(query).await
    }

    pub async fn prepare_remote_track(&self, remote_id: &str, title: &str, artist: &str) -> Result<Track> {
        let stream = self.yt_provider.resolve_stream(remote_id).await?;
        let cache_file = self.cache_dir.join(format!("{}.m4a", remote_id));

        if !cache_file.exists() || std::fs::metadata(&cache_file).map(|m| m.len()).unwrap_or(0) == 0 {
            self.yt_provider
                .download_with_range_resume(&stream.url, &cache_file)
                .await
                .map_err(|e| anyhow!("Failed to download stream: {}", e))?;
        }

        Ok(Track {
            id: TrackId(format!("yt:{}", remote_id)),
            source: TrackSource::Local {
                path: cache_file,
            },
            metadata: TrackMetadata {
                title: title.to_string(),
                artist: artist.to_string(),
                album: Some("YouTube Music".to_string()),
                duration: Duration::from_secs(210),
                track_number: None,
                year: None,
                artwork_path: None,
                artwork_url: None,
            },
        })
    }
}
