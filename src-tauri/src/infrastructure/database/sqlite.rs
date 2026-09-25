use crate::domain::track::{Track, TrackId, TrackMetadata, TrackSource};
use anyhow::Result;
use rusqlite::{params, Connection};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let conn = Connection::open(db_path)?;
        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                source_type TEXT NOT NULL,
                source_path TEXT,
                remote_provider TEXT,
                remote_id TEXT,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT,
                duration_ms INTEGER NOT NULL,
                track_number INTEGER,
                year INTEGER,
                artwork_path TEXT,
                artwork_url TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS playlist_tracks (
                playlist_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (playlist_id, position)
            );
            ",
        )?;
        Ok(())
    }

    pub fn insert_or_update_track(&self, track: &Track) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let (source_type, source_path, remote_provider, remote_id) = match &track.source {
            TrackSource::Local { path } => (
                "local",
                Some(path.to_string_lossy().to_string()),
                None,
                None,
            ),
            TrackSource::Remote {
                provider,
                remote_id,
            } => (
                "remote",
                None,
                Some(provider.clone()),
                Some(remote_id.clone()),
            ),
        };

        conn.execute(
            "
            INSERT INTO tracks (
                id, source_type, source_path, remote_provider, remote_id,
                title, artist, album, duration_ms, track_number, year,
                artwork_path, artwork_url, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                artist = excluded.artist,
                album = excluded.album,
                duration_ms = excluded.duration_ms,
                track_number = excluded.track_number,
                year = excluded.year,
                artwork_path = excluded.artwork_path,
                artwork_url = excluded.artwork_url;
            ",
            params![
                track.id.0,
                source_type,
                source_path,
                remote_provider,
                remote_id,
                track.metadata.title,
                track.metadata.artist,
                track.metadata.album,
                track.metadata.duration.as_millis() as i64,
                track.metadata.track_number,
                track.metadata.year,
                track.metadata.artwork_path,
                track.metadata.artwork_url,
                chrono::Utc::now().timestamp()
            ],
        )?;
        Ok(())
    }

    pub fn get_all_tracks(&self) -> Result<Vec<Track>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "
            SELECT id, source_type, source_path, remote_provider, remote_id,
                   title, artist, album, duration_ms, track_number, year,
                   artwork_path, artwork_url
            FROM tracks
            ORDER BY artist ASC, album ASC, track_number ASC, title ASC
            ",
        )?;

        let track_iter = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let source_type: String = row.get(1)?;
            let source_path: Option<String> = row.get(2)?;
            let remote_provider: Option<String> = row.get(3)?;
            let remote_id: Option<String> = row.get(4)?;
            let title: String = row.get(5)?;
            let artist: String = row.get(6)?;
            let album: Option<String> = row.get(7)?;
            let duration_ms: i64 = row.get(8)?;
            let track_number: Option<u32> = row.get(9)?;
            let year: Option<u32> = row.get(10)?;
            let artwork_path: Option<String> = row.get(11)?;
            let artwork_url: Option<String> = row.get(12)?;

            let source = if source_type == "local" {
                TrackSource::Local {
                    path: PathBuf::from(source_path.unwrap_or_default()),
                }
            } else {
                TrackSource::Remote {
                    provider: remote_provider.unwrap_or_else(|| "unknown".to_string()),
                    remote_id: remote_id.unwrap_or_default(),
                }
            };

            Ok(Track {
                id: TrackId(id),
                source,
                metadata: TrackMetadata {
                    title,
                    artist,
                    album,
                    duration: Duration::from_millis(duration_ms.max(0) as u64),
                    track_number,
                    year,
                    artwork_path,
                    artwork_url,
                },
            })
        })?;

        let mut tracks = Vec::new();
        for track in track_iter {
            tracks.push(track?);
        }
        Ok(tracks)
    }

    pub fn get_track_by_id(&self, id: &str) -> Result<Option<Track>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "
            SELECT id, source_type, source_path, remote_provider, remote_id,
                   title, artist, album, duration_ms, track_number, year,
                   artwork_path, artwork_url
            FROM tracks
            WHERE id = ?1
            ",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let id: String = row.get(0)?;
            let source_type: String = row.get(1)?;
            let source_path: Option<String> = row.get(2)?;
            let remote_provider: Option<String> = row.get(3)?;
            let remote_id: Option<String> = row.get(4)?;
            let title: String = row.get(5)?;
            let artist: String = row.get(6)?;
            let album: Option<String> = row.get(7)?;
            let duration_ms: i64 = row.get(8)?;
            let track_number: Option<u32> = row.get(9)?;
            let year: Option<u32> = row.get(10)?;
            let artwork_path: Option<String> = row.get(11)?;
            let artwork_url: Option<String> = row.get(12)?;

            let source = if source_type == "local" {
                TrackSource::Local {
                    path: PathBuf::from(source_path.unwrap_or_default()),
                }
            } else {
                TrackSource::Remote {
                    provider: remote_provider.unwrap_or_else(|| "unknown".to_string()),
                    remote_id: remote_id.unwrap_or_default(),
                }
            };

            Ok(Some(Track {
                id: TrackId(id),
                source,
                metadata: TrackMetadata {
                    title,
                    artist,
                    album,
                    duration: Duration::from_millis(duration_ms.max(0) as u64),
                    track_number,
                    year,
                    artwork_path,
                    artwork_url,
                },
            }))
        } else {
            Ok(None)
        }
    }
}
