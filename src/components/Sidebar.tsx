import React from "react";
import { Library, Search, Disc, Settings, Info, Music2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, appInfo } = usePlayerStore();

  const navItems = [
    { id: "library", label: "Local Library", icon: Library },
    { id: "youtube", label: "YouTube Music", icon: Search },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "about", label: "About", icon: Info },
  ] as const;

  return (
    <aside className="w-64 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col justify-between p-4 select-none shrink-0 h-full backdrop-blur-md">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <img
            src="/logo.png"
            alt="Uchan Logo"
            className="w-10 h-10 rounded-xl object-cover border border-zinc-700/60 shadow-lg shadow-black/50"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-zinc-100">
              {appInfo.name}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono tracking-tight">
              v{appInfo.version} - Clean Room
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-inner border border-zinc-700/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                }`}
              >
                <Icon size={16} className={isActive ? "text-zinc-100" : "text-zinc-400"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3 px-2 pt-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <Music2 size={13} className="text-zinc-300" />
          <span className="font-mono">Rodio Native Engine</span>
        </div>
        <div className="p-2.5 rounded-[12px] bg-zinc-900/60 border border-zinc-800/60 flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider">
            {appInfo.credit}
          </span>
          <span className="text-[10px] text-zinc-400">
            Native Audio & Clean Room Stack
          </span>
        </div>
      </div>
    </aside>
  );
};
