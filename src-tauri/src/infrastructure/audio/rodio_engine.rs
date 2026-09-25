use anyhow::{anyhow, Result};
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

pub struct AudioEngine {
    _stream: OutputStream,
    stream_handle: OutputStreamHandle,
    sink: Arc<parking_lot::Mutex<Sink>>,
    is_paused: Arc<AtomicBool>,
}

impl AudioEngine {
    pub fn new() -> Result<Self> {
        let (stream, stream_handle) = OutputStream::try_default()
            .map_err(|e| anyhow!("Failed to initialize audio output stream: {}", e))?;
        let sink = Sink::try_new(&stream_handle)
            .map_err(|e| anyhow!("Failed to create audio sink: {}", e))?;

        Ok(Self {
            _stream: stream,
            stream_handle,
            sink: Arc::new(parking_lot::Mutex::new(sink)),
            is_paused: Arc::new(AtomicBool::new(false)),
        })
    }

    pub fn play_file(&self, path: &Path) -> Result<()> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let source = Decoder::new(reader)
            .map_err(|e| anyhow!("Failed to decode audio file {}: {}", path.display(), e))?;

        let mut sink_lock = self.sink.lock();
        if let Ok(new_sink) = Sink::try_new(&self.stream_handle) {
            new_sink.set_volume(sink_lock.volume());
            new_sink.append(source);
            new_sink.play();
            *sink_lock = new_sink;
            self.is_paused.store(false, Ordering::SeqCst);
            Ok(())
        } else {
            sink_lock.stop();
            sink_lock.append(source);
            sink_lock.play();
            self.is_paused.store(false, Ordering::SeqCst);
            Ok(())
        }
    }

    pub fn pause(&self) {
        let sink = self.sink.lock();
        sink.pause();
        self.is_paused.store(true, Ordering::SeqCst);
    }

    pub fn resume(&self) {
        let sink = self.sink.lock();
        sink.play();
        self.is_paused.store(false, Ordering::SeqCst);
    }

    pub fn toggle(&self) -> bool {
        let sink = self.sink.lock();
        if sink.is_paused() {
            sink.play();
            self.is_paused.store(false, Ordering::SeqCst);
            true
        } else {
            sink.pause();
            self.is_paused.store(true, Ordering::SeqCst);
            false
        }
    }

    pub fn stop(&self) {
        let sink = self.sink.lock();
        sink.stop();
        self.is_paused.store(false, Ordering::SeqCst);
    }

    pub fn seek(&self, position: Duration) -> Result<()> {
        let sink = self.sink.lock();
        sink.try_seek(position)
            .map_err(|e| anyhow!("Seek error: {}", e))?;
        Ok(())
    }

    pub fn set_volume(&self, volume: f32) {
        let sink = self.sink.lock();
        sink.set_volume(volume.clamp(0.0, 1.0));
    }

    pub fn get_volume(&self) -> f32 {
        let sink = self.sink.lock();
        sink.volume()
    }

    pub fn get_position(&self) -> Duration {
        let sink = self.sink.lock();
        sink.get_pos()
    }

    pub fn is_empty(&self) -> bool {
        let sink = self.sink.lock();
        sink.empty()
    }

    pub fn is_paused(&self) -> bool {
        self.is_paused.load(Ordering::SeqCst)
    }
}
