import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  TrackDto,
  QueueStateDto,
  PlaybackStatusDto,
  AlbumDto,
  SearchResultDto,
  AppInfoDto,
} from "../types";

interface PlayerStore {
  // Navigation
  activeTab: "library" | "youtube" | "albums" | "settings" | "about";
  setActiveTab: (tab: "library" | "youtube" | "albums" | "settings" | "about") => void;

  // UI state
  isQueueOpen: boolean;
  toggleQueue: () => void;
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;

  // Playback state
  playback: PlaybackStatusDto;
  interpolatedPositionMs: number;
  volume: number;

  // Queue state
  queue: QueueStateDto;

  // Library & Search
  tracks: TrackDto[];
  albums: AlbumDto[];
  searchResults: SearchResultDto[];
  searchQuery: string;
  isSearching: boolean;
  isScanning: boolean;
  appInfo: AppInfoDto;

  // Actions
  init: () => Promise<void>;
  togglePlay: () => Promise<void>;
  playTrack: (track: TrackDto) => Promise<void>;
  playTrackById: (id: string) => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setVolume: (val: number) => Promise<void>;
  setShuffle: (val: boolean) => Promise<void>;
  setRepeat: (mode: string) => Promise<void>;
  playQueueIndex: (index: number) => Promise<void>;
  removeFromQueue: (index: number) => Promise<void>;

  // Data fetching
  loadLibrary: () => Promise<void>;
  scanFolder: (path: string) => Promise<void>;
  searchYouTube: (query: string) => Promise<void>;
  playYouTube: (item: SearchResultDto) => Promise<void>;
  updateInterpolation: () => void;
}

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  activeTab: "library",
  setActiveTab: (tab) => set({ activeTab: tab }),

  isQueueOpen: false,
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  statusMessage: null,
  setStatusMessage: (msg) => set({ statusMessage: msg }),

  playback: {
    state: "idle",
    current_track: null,
    position_ms: 0,
    duration_ms: 0,
    volume: 0.8,
    error_message: null,
  },
  interpolatedPositionMs: 0,
  volume: 0.8,

  queue: {
    items: [],
    current_index: null,
    shuffle_mode: false,
    repeat_mode: "off",
    revision: 0,
  },

  tracks: [],
  albums: [],
  searchResults: [],
  searchQuery: "",
  isSearching: false,
  isScanning: false,
  appInfo: {
    name: "Uchan Player",
    version: "0.1.0",
    author: "AzkaaHPS",
    credit: "Created By AzkaaHPS",
  },

  init: async () => {
    if (isTauri()) {
      try {
        const info = await invoke<AppInfoDto>("get_app_info");
        set({ appInfo: info });
      } catch (err) {
        console.warn("Could not fetch app info:", err);
      }
      await get().loadLibrary();
      try {
        const q = await invoke<QueueStateDto>("get_queue");
        const pb = await invoke<PlaybackStatusDto>("get_playback_status");
        set({ queue: q, playback: pb, volume: pb.volume, interpolatedPositionMs: pb.position_ms });
      } catch (err) {
        console.warn("Could not fetch initial playback/queue:", err);
      }
    } else {
      // Mock demo data when running outside Tauri desktop container
      const mockTrack: TrackDto = {
        id: "mock-1",
        title: "Opium Halo - Clean Room Theme",
        artist: "AzkaaHPS",
        album: "Void Soundwaves",
        duration_ms: 214000,
        artwork_url: "/logo.png",
        source_type: "local",
      };
      set({
        tracks: [mockTrack],
        playback: {
          state: "idle",
          current_track: mockTrack,
          position_ms: 0,
          duration_ms: 214000,
          volume: 0.8,
          error_message: null,
        },
        queue: {
          items: [{ id: "q-1", track: mockTrack }],
          current_index: 0,
          shuffle_mode: false,
          repeat_mode: "off",
          revision: 1,
        },
      });
    }
  },

  updateInterpolation: () => {
    const { playback, interpolatedPositionMs } = get();
    if (playback.state === "playing") {
      const nextPos = Math.min(playback.duration_ms, interpolatedPositionMs + 50);
      set({ interpolatedPositionMs: nextPos });
    }
  },

  togglePlay: async () => {
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("toggle_playback");
        set({ playback: status, interpolatedPositionMs: status.position_ms });
      } catch (err) {
        set({ statusMessage: String(err) });
      }
    } else {
      const curState = get().playback.state;
      const nextState = curState === "playing" ? "paused" : "playing";
      set((s) => ({ playback: { ...s.playback, state: nextState } }));
    }
  },

  playTrack: async (track) => {
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("play_track_by_id", { trackId: track.id });
        const q = await invoke<QueueStateDto>("get_queue");
        set({ playback: status, queue: q, interpolatedPositionMs: status.position_ms });
      } catch (err) {
        set({ statusMessage: String(err) });
      }
    } else {
      set({
        playback: {
          state: "playing",
          current_track: track,
          position_ms: 0,
          duration_ms: track.duration_ms,
          volume: get().volume,
          error_message: null,
        },
        interpolatedPositionMs: 0,
      });
    }
  },

  playTrackById: async (id) => {
    const t = get().tracks.find((x) => x.id === id);
    if (t) {
      await get().playTrack(t);
    }
  },

  seek: async (positionMs) => {
    set({ interpolatedPositionMs: positionMs });
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("seek_playback", { positionMs });
        set({ playback: status });
      } catch (err) {
        console.warn("Seek error:", err);
      }
    } else {
      set((s) => ({ playback: { ...s.playback, position_ms: positionMs } }));
    }
  },

  next: async () => {
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("next_track");
        const q = await invoke<QueueStateDto>("get_queue");
        set({ playback: status, queue: q, interpolatedPositionMs: status.position_ms });
      } catch (err) {
        console.warn("Next error:", err);
      }
    } else {
      const { queue } = get();
      if (queue.items.length > 0) {
        const nextIdx = ((queue.current_index ?? 0) + 1) % queue.items.length;
        const nextTrack = queue.items[nextIdx].track;
        set({
          queue: { ...queue, current_index: nextIdx },
          playback: { ...get().playback, current_track: nextTrack, position_ms: 0 },
          interpolatedPositionMs: 0,
        });
      }
    }
  },

  previous: async () => {
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("previous_track");
        const q = await invoke<QueueStateDto>("get_queue");
        set({ playback: status, queue: q, interpolatedPositionMs: status.position_ms });
      } catch (err) {
        console.warn("Previous error:", err);
      }
    } else {
      const { queue } = get();
      if (queue.items.length > 0) {
        const prevIdx =
          (queue.current_index ?? 0) === 0 ? queue.items.length - 1 : (queue.current_index ?? 0) - 1;
        const prevTrack = queue.items[prevIdx].track;
        set({
          queue: { ...queue, current_index: prevIdx },
          playback: { ...get().playback, current_track: prevTrack, position_ms: 0 },
          interpolatedPositionMs: 0,
        });
      }
    }
  },

  setVolume: async (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    set({ volume: clamped });
    if (isTauri()) {
      try {
        await invoke("set_volume", { volume: clamped });
      } catch (err) {
        console.warn("Volume error:", err);
      }
    }
  },

  setShuffle: async (val) => {
    if (isTauri()) {
      try {
        const q = await invoke<QueueStateDto>("set_shuffle", { shuffle: val });
        set({ queue: q });
      } catch (err) {
        console.warn("Shuffle error:", err);
      }
    } else {
      set((s) => ({ queue: { ...s.queue, shuffle_mode: val } }));
    }
  },

  setRepeat: async (mode) => {
    if (isTauri()) {
      try {
        const q = await invoke<QueueStateDto>("set_repeat", { mode });
        set({ queue: q });
      } catch (err) {
        console.warn("Repeat error:", err);
      }
    } else {
      set((s) => ({ queue: { ...s.queue, repeat_mode: mode } }));
    }
  },

  playQueueIndex: async (index) => {
    if (isTauri()) {
      try {
        const q = await invoke<QueueStateDto>("play_queue_index", { index });
        const pb = await invoke<PlaybackStatusDto>("get_playback_status");
        set({ queue: q, playback: pb, interpolatedPositionMs: pb.position_ms });
      } catch (err) {
        console.warn("PlayQueueIndex error:", err);
      }
    } else {
      const { queue } = get();
      if (queue.items[index]) {
        const targetTrack = queue.items[index].track;
        set({
          queue: { ...queue, current_index: index },
          playback: { ...get().playback, state: "playing", current_track: targetTrack, position_ms: 0 },
          interpolatedPositionMs: 0,
        });
      }
    }
  },

  removeFromQueue: async (index) => {
    if (isTauri()) {
      try {
        const q = await invoke<QueueStateDto>("remove_from_queue", { index });
        set({ queue: q });
      } catch (err) {
        console.warn("Remove queue error:", err);
      }
    } else {
      set((s) => {
        const newItems = s.queue.items.filter((_, i) => i !== index);
        return { queue: { ...s.queue, items: newItems } };
      });
    }
  },

  loadLibrary: async () => {
    if (isTauri()) {
      try {
        const tracks = await invoke<TrackDto[]>("get_library_tracks");
        const albums = await invoke<AlbumDto[]>("get_library_albums");
        set({ tracks, albums });
      } catch (err) {
        console.warn("Error loading library:", err);
      }
    }
  },

  scanFolder: async (path) => {
    set({ isScanning: true, statusMessage: "Scanning directory for audio files..." });
    if (isTauri()) {
      try {
        const count = await invoke<number>("scan_local_folder", { path });
        set({ statusMessage: `Scan complete: added ${count} tracks.` });
        await get().loadLibrary();
      } catch (err) {
        set({ statusMessage: `Scan failed: ${err}` });
      } finally {
        set({ isScanning: false });
      }
    } else {
      setTimeout(() => {
        set({ isScanning: false, statusMessage: "Demo: folder scan simulation finished." });
      }, 1000);
    }
  },

  searchYouTube: async (query) => {
    if (!query.trim()) return;
    set({ isSearching: true, searchQuery: query, statusMessage: "Searching YouTube Music..." });
    if (isTauri()) {
      try {
        const results = await invoke<SearchResultDto[]>("search_youtube_music", { query });
        set({ searchResults: results, statusMessage: `Found ${results.length} tracks.` });
      } catch (err) {
        set({ statusMessage: `Search error: ${err}` });
      } finally {
        set({ isSearching: false });
      }
    } else {
      // Mock result
      setTimeout(() => {
        set({
          isSearching: false,
          statusMessage: "Search results ready (simulated)",
          searchResults: [
            {
              provider: "youtube",
              remote_id: "demo-yt-1",
              title: `${query} - Official Audio`,
              artist: "Artist Demo",
              album: "Single",
              duration_ms: 215000,
              thumbnail_url: "/logo.png",
            },
          ],
        });
      }, 600);
    }
  },

  playYouTube: async (item) => {
    set({ statusMessage: `Resolving stream for ${item.title}...` });
    if (isTauri()) {
      try {
        const status = await invoke<PlaybackStatusDto>("play_youtube_track", {
          remoteId: item.remote_id,
          title: item.title,
          artist: item.artist,
        });
        const q = await invoke<QueueStateDto>("get_queue");
        set({ playback: status, queue: q, statusMessage: `Playing ${item.title}` });
      } catch (err) {
        set({ statusMessage: `Failed to stream: ${err}` });
      }
    } else {
      const demoTrack: TrackDto = {
        id: `yt:${item.remote_id}`,
        title: item.title,
        artist: item.artist,
        album: item.album || "YouTube Music",
        duration_ms: item.duration_ms,
        artwork_url: item.thumbnail_url || "/logo.png",
        source_type: "youtube",
      };
      set({
        playback: {
          state: "playing",
          current_track: demoTrack,
          position_ms: 0,
          duration_ms: item.duration_ms,
          volume: get().volume,
          error_message: null,
        },
        statusMessage: `Simulating stream: ${item.title}`,
      });
    }
  },
}));
