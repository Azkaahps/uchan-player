import React, { useState } from "react";
import { Search, Play, Clock, Radio, Sparkles } from "lucide-react";
import { usePlayerStore } from "../../stores/usePlayerStore";

export const YouTubeView: React.FC = () => {
  const { searchResults, isSearching, searchYouTube, playYouTube, statusMessage } = usePlayerStore();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchYouTube(query.trim());
    }
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 bg-gradient-to-b from-zinc-900/40 to-black select-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">YouTube Music</h1>
            <span className="px-2 py-0.5 rounded-[8px] bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
              InnerTube Stream Resolver
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Search tracks and stream with progressive disk cache
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search song, artist, album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-zinc-900/90 border border-zinc-800 rounded-[12px] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 w-64"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3.5 py-1.5 rounded-[12px] bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-white transition-all shadow active:scale-95 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="text-[11px] font-mono text-zinc-400 px-1">{statusMessage}</div>
      )}

      <div className="flex-1 overflow-y-auto rounded-[12px] border border-zinc-800/80 bg-zinc-950/60 shadow-inner">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
            <Radio size={32} className="text-zinc-600" />
            <span className="text-xs font-medium">Discover Online Music</span>
            <span className="text-[11px] text-zinc-600">
              Type a search query above to browse YouTube Music tracks.
            </span>
            <div className="flex items-center gap-2 mt-2">
              {["Playboi Carti", "Ken Carson", "Destroy Lonely", "Travis Scott"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    searchYouTube(tag);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  <Sparkles size={11} className="text-zinc-400" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-mono text-zinc-400 bg-zinc-900/40">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4">Artist</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4 w-20 text-right">
                  <Clock size={12} className="inline ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((item, idx) => (
                <tr
                  key={item.remote_id}
                  onClick={() => playYouTube(item)}
                  className="group hover:bg-zinc-900/60 border-b border-zinc-900/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 text-center font-mono text-zinc-500 group-hover:text-zinc-200">
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <Play size={12} className="hidden group-hover:inline fill-current text-zinc-100" />
                  </td>
                  <td className="py-2.5 px-4 font-medium text-zinc-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[6px] bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                      <img
                        src={item.thumbnail_url || "/logo.png"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </td>
                  <td className="py-2.5 px-4 text-zinc-400 truncate">{item.artist}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px] text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      InnerTube
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-zinc-500 text-[11px]">
                    {formatDuration(item.duration_ms)}
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
