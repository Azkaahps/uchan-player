import React, { useState } from "react";
import { FolderOpen, Play, Clock, Search, Music } from "lucide-react";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { open } from "@tauri-apps/plugin-dialog";

export const LibraryView: React.FC = () => {
  const { tracks, isScanning, scanFolder, playTrack, statusMessage } = usePlayerStore();
  const [filterText, setFilterText] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [showPathInput, setShowPathInput] = useState(false);

  const handlePickFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Music Directory",
      });
      if (selected && typeof selected === "string") {
        await scanFolder(selected);
      }
    } catch {
      setShowPathInput(true);
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPath.trim()) {
      await scanFolder(manualPath.trim());
      setShowPathInput(false);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const filteredTracks = tracks.filter((t) => {
    const q = filterText.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 bg-gradient-to-b from-zinc-900/40 to-black select-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Local Library</h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {tracks.length} tracks cataloged in SQLite
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter library..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-zinc-900/90 border border-zinc-800 rounded-[12px] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 w-52"
            />
          </div>

          <button
            onClick={handlePickFolder}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-white transition-all shadow active:scale-95 disabled:opacity-50"
          >
            <FolderOpen size={14} />
            <span>{isScanning ? "Scanning..." : "Scan Folder"}</span>
          </button>
        </div>
      </div>

      {showPathInput && (
        <form onSubmit={handleManualScan} className="flex gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-[12px]">
          <input
            type="text"
            placeholder="Enter directory path (e.g. D:/Music)..."
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-[8px] px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-zinc-800 text-zinc-100 rounded-[8px] text-xs hover:bg-zinc-700 font-medium"
          >
            Scan Path
          </button>
        </form>
      )}

      {statusMessage && (
        <div className="text-[11px] font-mono text-zinc-400 px-1">{statusMessage}</div>
      )}

      <div className="flex-1 overflow-y-auto rounded-[12px] border border-zinc-800/80 bg-zinc-950/60 shadow-inner">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
            <Music size={32} className="text-zinc-600" />
            <span className="text-xs font-medium">No audio files found</span>
            <span className="text-[11px] text-zinc-600">
              Click &quot;Scan Folder&quot; to index your local audio files (MP3, FLAC, WAV, M4A, OGG).
            </span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 bg-zinc-900/40">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4">Artist</th>
                <th className="py-2.5 px-4">Album</th>
                <th className="py-2.5 px-4 w-20 text-right">
                  <Clock size={12} className="inline ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track, idx) => (
                <tr
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="group hover:bg-zinc-900/60 border-b border-zinc-900/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 text-center font-mono text-zinc-500 group-hover:text-zinc-200">
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <Play size={12} className="hidden group-hover:inline fill-current text-zinc-100" />
                  </td>
                  <td className="py-2.5 px-4 font-medium text-zinc-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                      <img
                        src={track.artwork_url || "/logo.png"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate">{track.title}</span>
                  </td>
                  <td className="py-2.5 px-4 text-zinc-400 truncate">{track.artist}</td>
                  <td className="py-2.5 px-4 text-zinc-400 truncate">{track.album || "-"}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-zinc-500 text-[11px]">
                    {formatDuration(track.duration_ms)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
