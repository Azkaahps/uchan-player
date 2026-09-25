import React from "react";
import { X, Play, Trash2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";

export const RightQueuePanel: React.FC = () => {
  const { queue, isQueueOpen, toggleQueue, playQueueIndex, removeFromQueue } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <aside className="w-80 bg-zinc-950/95 border-l border-zinc-800/80 flex flex-col h-full shrink-0 select-none z-20 backdrop-blur-md">
      <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-zinc-100 tracking-wide uppercase">
            Up Next
          </span>
          <span className="px-1.5 py-0.5 rounded-[8px] bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            {queue.items.length} tracks
          </span>
        </div>
        <button
          onClick={toggleQueue}
          className="p-1 rounded-[8px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {queue.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs gap-1">
            <span>Queue is empty</span>
            <span className="text-[10px] text-zinc-600">Add songs from Library or Search</span>
          </div>
        ) : (
          queue.items.map((item, index) => {
            const isCurrent = queue.current_index === index;
            return (
              <div
                key={item.id}
                className={`group flex items-center justify-between p-2 rounded-[12px] border transition-all ${
                  isCurrent
                    ? "bg-zinc-900/90 border-zinc-700/80 text-zinc-100"
                    : "border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/60 text-zinc-300"
                }`}
              >
                <div
                  onClick={() => playQueueIndex(index)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-8 h-8 rounded-[8px] bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                    <img
                      src={item.track.artwork_url || "/logo.png"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play size={10} className="fill-white text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{item.track.title}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{item.track.artist}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(index);
                  }}
                  title="Remove from queue"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[8px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
