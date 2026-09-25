use crate::domain::album::Album;
use crate::domain::track::Track;
use crate::infrastructure::database::Database;
use crate::infrastructure::providers::LocalProvider;
use anyhow::Result;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

pub struct LibraryService {
    db: Arc<Database>,
}

impl LibraryService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn scan_directory(&self, path: &Path) -> Result<usize> {
        let tracks = LocalProvider::scan_directory(path)?;
        let count = tracks.len();
        for track in &tracks {
            let _ = self.db.insert_or_update_track(track);
        }
        Ok(count)
    }

    pub fn get_tracks(&self) -> Result<Vec<Track>> {
        self.db.get_all_tracks()
    }

    pub fn get_albums(&self) -> Result<Vec<Album>> {
        let tracks = self.db.get_all_tracks()?;
        let mut album_map: HashMap<String, (String, String, Option<u32>, usize, Option<String>)> =
            HashMap::new();

        for track in tracks {
            let album_name = track
                .metadata
                .album
                .clone()
                .unwrap_or_else(|| "Unknown Album".to_string());
            let artist_name = track.metadata.artist.clone();
            let key = format!("{}:{}", artist_name, album_name);

            let entry = album_map.entry(key.clone()).or_insert((
                album_name,
                artist_name,
                track.metadata.year,
                0,
                track.metadata.artwork_path.clone(),
            ));

            entry.3 += 1;
            if entry.4.is_none() && track.metadata.artwork_path.is_some() {
                entry.4 = track.metadata.artwork_path;
            }
        }

        let mut albums = Vec::new();
        for (id, (title, artist, year, track_count, artwork_path)) in album_map {
            albums.push(Album {
                id,
                title,
                artist,
                year,
                track_count,
                artwork_path,
            });
        }

        albums.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
        Ok(albums)
    }
}
