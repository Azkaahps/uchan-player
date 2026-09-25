use crate::domain::provider::{EphemeralStream, SearchResult};
use anyhow::{anyhow, Result};
use reqwest::header::{HeaderMap, HeaderValue, RANGE, USER_AGENT};
use reqwest::Client;
use serde_json::Value;
use std::fs::OpenOptions;
use std::io::{Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

pub struct YouTubeProvider {
    client: Client,
}

impl Default for YouTubeProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl YouTubeProvider {
    pub fn new() -> Self {
        let mut headers = HeaderMap::new();
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"),
        );
        let client = Client::builder()
            .default_headers(headers)
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { client }
    }

    pub async fn search(&self, query: &str) -> Result<Vec<SearchResult>> {
        let url = "https://music.youtube.com/youtubei/v1/search";
        let body = serde_json::json!({
            "context": {
                "client": {
                    "clientName": "WEB_REMIX",
                    "clientVersion": "1.20240901.01.00",
                    "hl": "en",
                    "gl": "US"
                }
            },
            "query": query,
            "params": "Eg-KAQwIABAAGAAgACgAMABqChAEEAMQCRAFEAo%3D"
        });

        let resp = self.client.post(url).json(&body).send().await?;
        let data: Value = resp.json().await?;

        let mut results = Vec::new();
        if let Some(contents) = data
            .pointer("/contents/tabbedSearchResultsRenderer/tabs/0/tabRenderer/content/sectionListRenderer/contents")
            .and_then(|v| v.as_array())
        {
            for section in contents {
                if let Some(items) = section
                    .pointer("/musicShelfRenderer/contents")
                    .and_then(|v| v.as_array())
                {
                    for item in items {
                        if let Some(item_renderer) = item.get("musicResponsiveListItemRenderer") {
                            let video_id = item_renderer
                                .pointer("/playlistItemData/videoId")
                                .and_then(|v| v.as_str());

                            let title = item_renderer
                                .pointer("/flexColumns/0/musicResponsiveListItemFlexColumnRenderer/text/runs/0/text")
                                .and_then(|v| v.as_str());

                            let artist = item_renderer
                                .pointer("/flexColumns/1/musicResponsiveListItemFlexColumnRenderer/text/runs/0/text")
                                .and_then(|v| v.as_str());

                            let thumbnail = item_renderer
                                .pointer("/thumbnail/musicThumbnailRenderer/thumbnail/thumbnails/0/url")
                                .and_then(|v| v.as_str());

                            if let (Some(id), Some(t)) = (video_id, title) {
                                results.push(SearchResult {
                                    provider: "youtube".to_string(),
                                    remote_id: id.to_string(),
                                    title: t.to_string(),
                                    artist: artist.unwrap_or("Unknown Artist").to_string(),
                                    album: None,
                                    duration_seconds: 210,
                                    thumbnail_url: thumbnail.map(|s| s.to_string()),
                                });
                            }
                        }
                    }
                }
            }
        }

        Ok(results)
    }

    pub async fn resolve_stream(&self, video_id: &str) -> Result<EphemeralStream> {
        let url = "https://music.youtube.com/youtubei/v1/player";
        let body = serde_json::json!({
            "context": {
                "client": {
                    "clientName": "ANDROID",
                    "clientVersion": "19.20.35",
                    "hl": "en",
                    "gl": "US"
                }
            },
            "videoId": video_id
        });

        let resp = self.client.post(url).json(&body).send().await?;
        let data: Value = resp.json().await?;

        if let Some(formats) = data
            .pointer("/streamingData/adaptiveFormats")
            .and_then(|v| v.as_array())
        {
            // Pick highest quality audio-only stream (mimeType audio/mp4 or audio/webm)
            let mut best_format: Option<&Value> = None;
            let mut best_bitrate = 0u64;

            for f in formats {
                let mime = f.get("mimeType").and_then(|v| v.as_str()).unwrap_or("");
                if mime.starts_with("audio/") {
                    let bitrate = f.get("bitrate").and_then(|v| v.as_u64()).unwrap_or(0);
                    if bitrate > best_bitrate {
                        best_bitrate = bitrate;
                        best_format = Some(f);
                    }
                }
            }

            if let Some(f) = best_format {
                if let Some(stream_url) = f.get("url").and_then(|v| v.as_str()) {
                    let mime = f.get("mimeType").and_then(|v| v.as_str()).unwrap_or("audio/mp4");
                    return Ok(EphemeralStream {
                        url: stream_url.to_string(),
                        format: mime.to_string(),
                        bitrate_kbps: Some((best_bitrate / 1000) as u32),
                        ttl: Duration::from_secs(3600 * 5),
                    });
                }
            }
        }

        Err(anyhow!("Failed to resolve audio stream for video {}", video_id))
    }

    pub async fn download_with_range_resume(
        &self,
        stream_url: &str,
        dest_path: &Path,
    ) -> Result<PathBuf> {
        let mut existing_bytes = 0u64;
        if dest_path.exists() {
            if let Ok(meta) = std::fs::metadata(dest_path) {
                existing_bytes = meta.len();
            }
        }

        let mut req = self.client.get(stream_url);
        if existing_bytes > 0 {
            req = req.header(RANGE, format!("bytes={}-", existing_bytes));
        }

        let resp = req.send().await?;
        let status = resp.status();

        let mut file = if status == reqwest::StatusCode::PARTIAL_CONTENT {
            let mut f = OpenOptions::new().append(true).open(dest_path)?;
            f.seek(SeekFrom::End(0))?;
            f
        } else {
            OpenOptions::new().write(true).create(true).truncate(true).open(dest_path)?
        };

        let mut stream = resp.bytes_stream();
        use futures_util::StreamExt;
        while let Some(chunk) = stream.next().await {
            let data = chunk?;
            file.write_all(&data)?;
        }

        Ok(dest_path.to_path_buf())
    }
}
