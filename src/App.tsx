import React, { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { PlayerBar } from "./components/PlayerBar";
import { RightQueuePanel } from "./components/RightQueuePanel";
import { LibraryView } from "./components/views/LibraryView";
import { YouTubeView } from "./components/views/YouTubeView";
import { AlbumsView } from "./components/views/AlbumsView";
import { SettingsView } from "./components/views/SettingsView";
import { AboutView } from "./components/views/AboutView";
import { usePlayerStore } from "./stores/usePlayerStore";

export const App: React.FC = () => {
  const { activeTab, init, updateInterpolation } = usePlayerStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      updateInterpolation();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [updateInterpolation]);

  const renderActiveView = () => {
    switch (activeTab) {
      case "library":
        return <LibraryView />;
      case "youtube":
        return <YouTubeView />;
      case "albums":
        return <AlbumsView />;
      case "settings":
        return <SettingsView />;
      case "about":
        return <AboutView />;
      default:
        return <LibraryView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-zinc-100 overflow-hidden font-sans select-none">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderActiveView()}
        </main>
        <RightQueuePanel />
      </div>
      <PlayerBar />
    </div>
  );
};

export default App;
