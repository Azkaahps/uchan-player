import React, { useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";

export const PlayerBar: React.FC = () => {
  const {
    playback,
    interpolatedPositionMs,
    volume,
    queue,
    isQueueOpen,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setShuffle,
    setRepeat,
    toggleQueue,
  } = usePlayerStore();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const seekbarRef = useRef<HTMLDivElement>(null);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekbarRef.current || playback.duration_ms <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMs = Math.floor(ratio * playback.duration_ms);
    seek(targetMs);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const currentTrack = playback.current_track;
  const progressPercent = playback.duration_ms > 0
    ? Math.min(100, (interpolatedPositionMs / playback.duration_ms) * 100)
    : 0;

  const isPlaying = playback.state === "playing";

  return (
    <footer className="h-20 bg-zinc-950 border-t border-zinc-800/80 px-4 flex items-center justify-between select-none z-30 shrink-0">
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        <div className="relative w-12 h-12 rounded-[12px] bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 shadow-md">
          {currentTrack?.artwork_url ? (
            <img
              src={currentTrack.artwork_url}
              alt="Artwork"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/logo.png"
              alt="Logo Cover"
              className="w-full h-full object-cover opacity-80"
            />
          )}
        </div>
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-semibold text-zinc-100 truncate">
            {currentTrack?.title || "No Track Selected"}
          </span>
          <span className="text-[11px] text-zinc-400 truncate">
            {currentTrack?.artist || "Uchan Player"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShuffle(!queue.shuffle_mode)}
            title="Shuffle"
            className={`p-1.5 rounded-[12px] transition-colors ${
              queue.shuffle_mode
                ? "text-zinc-100 bg-zinc-800 border border-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Shuffle size={14} />
          </button>

          <button
            onClick={previous}
            title="Previous"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-md active:scale-95"
          >
            {isPlaying ? (
              <Pause size={17} className="fill-current" />
            ) : (
              <Play size={17} className="fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            title="Next"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <SkipForward size={18} />
          </button>

          <button
            onClick={() => {
              const nextMode =
                queue.repeat_mode === "off"
                  ? "all"
                  : queue.repeat_mode === "all"
                  ? "one"
                  : "off";
              setRepeat(nextMode);
            }}
            title={`Repeat: ${queue.repeat_mode}`}
            className={`p-1.5 rounded-[12px] transition-colors ${
              queue.repeat_mode !== "off"
                ? "text-zinc-100 bg-zinc-800 border border-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Repeat size={14} />
          </button>
        </div>

        <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-zinc-400">
          <span className="w-8 text-right">{formatTime(interpolatedPositionMs)}</span>
          <div
            ref={seekbarRef}
            onClick={handleSeekClick}
            className="flex-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer relative group overflow-hidden"
          >
            <div
              className="h-full bg-zinc-300 group-hover:bg-white rounded-full transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="w-8">{formatTime(playback.duration_ms)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3.5 w-1/4 min-w-[180px]">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(parseFloat(e.target.value));
            }}
            className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200"
          />
        </div>

        <button
          onClick={toggleQueue}
          title="Toggle Queue"
          className={`p-2 rounded-[12px] transition-colors border ${
            isQueueOpen
              ? "bg-zinc-800 text-zinc-100 border-zinc-700"
              : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900"
          }`}
        >
          <ListMusic size={16} />
        </button>
      </div>
    </footer>
  );
};
