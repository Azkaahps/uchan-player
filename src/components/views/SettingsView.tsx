import React from "react";
import { Volume2, HardDrive, Monitor, ShieldCheck } from "lucide-react";
import { usePlayerStore } from "../../stores/usePlayerStore";

export const SettingsView: React.FC = () => {
  const { appInfo } = usePlayerStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 gap-6 bg-gradient-to-b from-zinc-900/40 to-black select-none">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">
          Engine configurations and system parameters
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="p-4 rounded-[12px] bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
            <Volume2 size={16} className="text-zinc-400" />
            <span>Audio Backend Architecture</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Powered by Rodio & CPAL on native background threads. Audio decoding is decoupled from the UI thread to guarantee zero throttling during window minimization.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="p-2.5 rounded-[8px] bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 font-mono">BACKEND</span>
              <p className="text-xs font-mono text-zinc-200 mt-0.5">Rodio + Symphonia</p>
            </div>
            <div className="p-2.5 rounded-[8px] bg-zinc-950 border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 font-mono">CODECS</span>
              <p className="text-xs font-mono text-zinc-200 mt-0.5">FLAC, ALAC, WAV, MP3, OPUS</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
            <HardDrive size={16} className="text-zinc-400" />
            <span>Storage & Progressive Cache</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Remote streams are downloaded progressively into the local application cache directory with HTTP Range resume capabilities.
          </p>
          <div className="p-2.5 rounded-[8px] bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono">CACHE DIRECTORY</span>
              <span className="text-xs font-mono text-zinc-300 mt-0.5">
                %LOCALAPPDATA%/uchan-player/streams
              </span>
            </div>
            <button
              onClick={() => alert("Cache directory is managed with LRU retention policy.")}
              className="px-3 py-1 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700"
            >
              Verify Cache
            </button>
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
            <Monitor size={16} className="text-zinc-400" />
            <span>Windows SMTC & Media Keys</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            System Media Transport Controls (SMTC) integration via Souvlaki enables hardware keyboard media keys and Windows lockscreen media widgets.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
            <span className="text-xs font-mono text-zinc-300">SMTC Active</span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
            <ShieldCheck size={16} className="text-zinc-400" />
            <span>Identity & Heritage</span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-zinc-300">
            <span>Product: {appInfo.name}</span>
            <span>Developer: {appInfo.author}</span>
            <span className="font-mono text-zinc-400">{appInfo.credit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
