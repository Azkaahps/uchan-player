use crate::domain::track::Track;
use crate::infrastructure::metadata::MetadataExtractor;
use anyhow::Result;
use std::path::Path;
use walkdir::WalkDir;

pub struct LocalProvider;

impl LocalProvider {
    pub fn scan_directory(dir: &Path) -> Result<Vec<Track>> {
        let mut tracks = Vec::new();
        let supported_extensions = ["mp3", "flac", "wav", "m4a", "ogg", "opus", "aac"];

        for entry in WalkDir::new(dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if supported_extensions.contains(&ext_lower.as_str()) {
                        if let Ok(track) = MetadataExtractor::parse_file(path) {
                            tracks.push(track);
                        }
                    }
                }
            }
        }

        Ok(tracks)
    }
}
