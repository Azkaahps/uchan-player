import React from "react";
import { Code2, Cpu, Database, Music } from "lucide-react";
import { usePlayerStore } from "../../stores/usePlayerStore";

export const AboutView: React.FC = () => {
  const { appInfo } = usePlayerStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 gap-6 bg-gradient-to-b from-zinc-900/40 to-black select-none items-center justify-center">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl shadow-black/80">
          <img
            src="/logo.png"
            alt="Uchan Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            {appInfo.name}
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            Version {appInfo.version} - Clean Room Implementation
          </span>
          <div className="mt-2 inline-block px-3 py-1 rounded-[12px] bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200">
            {appInfo.credit}
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mt-1">
          A high-performance native desktop music streaming client. Designed with Sonora visual principles and rebuilt entirely from scratch with an independent clean-room architecture.
        </p>

        <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left">
          <div className="p-3 rounded-[12px] bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
            <Cpu size={16} className="text-zinc-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-500 font-mono">BACKEND</span>
              <span className="text-xs font-medium text-zinc-200 truncate">Tauri v2 + Rust</span>
            </div>
          </div>

          <div className="p-3 rounded-[12px] bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
            <Music size={16} className="text-zinc-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-500 font-mono">AUDIO ENGINE</span>
              <span className="text-xs font-medium text-zinc-200 truncate">Rodio + CPAL</span>
            </div>
          </div>

          <div className="p-3 rounded-[12px] bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
            <Database size={16} className="text-zinc-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-500 font-mono">DATABASE</span>
              <span className="text-xs font-medium text-zinc-200 truncate">SQLite + Lofty</span>
            </div>
          </div>

          <div className="p-3 rounded-[12px] bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
            <Code2 size={16} className="text-zinc-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-zinc-500 font-mono">FRONTEND</span>
              <span className="text-xs font-medium text-zinc-200 truncate">React 19 + Tailwind v4</span>
            </div>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-600 mt-2">
          Copyright 2026 AzkaaHPS. All rights reserved.
        </span>
      </div>
    </div>
  );
};
