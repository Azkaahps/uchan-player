use anyhow::{anyhow, Result};
use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, PlatformConfig};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;

pub struct SmtcService {
    sender: Sender<MediaControlEvent>,
    receiver: Arc<parking_lot::Mutex<Receiver<MediaControlEvent>>>,
}

impl Default for SmtcService {
    fn default() -> Self {
        Self::new()
    }
}

impl SmtcService {
    pub fn new() -> Self {
        let (tx, rx) = channel();
        Self {
            sender: tx,
            receiver: Arc::new(parking_lot::Mutex::new(rx)),
        }
    }

    pub fn init_controls(
        &self,
        hwnd: Option<*mut std::ffi::c_void>,
    ) -> Result<Option<MediaControls>> {
        #[cfg(target_os = "windows")]
        {
            let config = PlatformConfig {
                dbus_name: "uchan_player",
                display_name: "Uchan Player",
                hwnd,
            };

            let mut controls =
                MediaControls::new(config).map_err(|e| anyhow!("Souvlaki init error: {:?}", e))?;
            let tx = self.sender.clone();
            controls
                .attach(move |event| {
                    let _ = tx.send(event);
                })
                .map_err(|e| anyhow!("Souvlaki attach error: {:?}", e))?;

            Ok(Some(controls))
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = hwnd;
            Ok(None)
        }
    }

    pub fn poll_events(&self) -> Vec<MediaControlEvent> {
        let rx = self.receiver.lock();
        let mut events = Vec::new();
        while let Ok(event) = rx.try_recv() {
            events.push(event);
        }
        events
    }

    pub fn update_metadata(
        controls: &mut MediaControls,
        title: &str,
        artist: &str,
        album: Option<&str>,
        duration: Option<std::time::Duration>,
        cover_url: Option<&str>,
    ) -> Result<()> {
        controls
            .set_metadata(MediaMetadata {
                title: Some(title),
                artist: Some(artist),
                album,
                duration,
                cover_url,
            })
            .map_err(|e| anyhow!("Souvlaki set_metadata error: {:?}", e))?;
        Ok(())
    }
}
