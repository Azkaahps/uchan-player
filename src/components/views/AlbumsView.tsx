import React from "react";
import { Disc, Play } from "lucide-react";
import { usePlayerStore } from "../../stores/usePlayerStore";

export const AlbumsView: React.FC = () => {
  const { albums } = usePlayerStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 bg-gradient-to-b from-zinc-900/40 to-black select-none">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Albums</h1>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">
          {albums.length} releases categorized
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
            <Disc size={32} className="text-zinc-600" />
            <span className="text-xs font-medium">No albums available</span>
            <span className="text-[11px] text-zinc-600">
              Scan your local library to automatically group tracks into albums.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group p-3 rounded-[12px] bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer flex flex-col gap-2.5 shadow-sm"
              >
                <div className="relative aspect-square rounded-[8px] overflow-hidden bg-zinc-950 border border-zinc-800">
                  <img
                    src={album.artwork_path || "/logo.png"}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play size={16} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-zinc-100 truncate">
                    {album.title}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {album.artist}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1">
                    {album.track_count} tracks {album.year ? `- ${album.year}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
