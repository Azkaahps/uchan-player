use crate::domain::track::{Track, TrackId, TrackMetadata, TrackSource};
use anyhow::Result;
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::probe::Probe;
use lofty::tag::Accessor;
use std::path::Path;
use std::time::Duration;

pub struct MetadataExtractor;

impl MetadataExtractor {
    pub fn parse_file(path: &Path) -> Result<Track> {
        let tagged_file = Probe::open(path)?.read()?;
        let properties = tagged_file.properties();
        let duration = properties.duration();

        let tag = tagged_file
            .primary_tag()
            .or_else(|| tagged_file.first_tag());

        let title = tag
            .and_then(|t| t.title().map(|s| s.to_string()))
            .unwrap_or_else(|| {
                path.file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_else(|| "Unknown Track".to_string())
            });

        let artist = tag
            .and_then(|t| t.artist().map(|s| s.to_string()))
            .unwrap_or_else(|| "Unknown Artist".to_string());

        let album = tag.and_then(|t| t.album().map(|s| s.to_string()));
        let track_number = tag.and_then(|t| t.track());
        let year = tag.and_then(|t| t.year());

        // Extract artwork if present
        let mut artwork_path = None;
        if let Some(tag) = tag {
            if let Some(picture) = tag.pictures().first() {
                let cache_dir = dirs::cache_dir()
                    .unwrap_or_else(std::env::temp_dir)
                    .join("uchan-player")
                    .join("artwork");
                let _ = std::fs::create_dir_all(&cache_dir);
                let art_id = format!("{:x}", md5_hash(picture.data()));
                let art_file = cache_dir.join(format!("{}.jpg", art_id));
                if !art_file.exists() {
                    let _ = std::fs::write(&art_file, picture.data());
                }
                artwork_path = Some(art_file.to_string_lossy().to_string());
            }
        }

        let track_id = format!("local:{}", path.to_string_lossy());

        Ok(Track {
            id: TrackId(track_id),
            source: TrackSource::Local {
                path: path.to_path_buf(),
            },
            metadata: TrackMetadata {
                title,
                artist,
                album,
                duration: if duration.is_zero() {
                    Duration::from_secs(180)
                } else {
                    duration
                },
                track_number,
                year,
                artwork_path,
                artwork_url: None,
            },
        })
    }
}

fn md5_hash(data: &[u8]) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::Hasher;
    let mut hasher = DefaultHasher::new();
    hasher.write(data);
    hasher.finish()
}
