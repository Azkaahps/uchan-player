export interface TrackDto {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration_ms: number;
  artwork_url?: string | null;
  source_type: string;
}

export interface QueueItemDto {
  id: string;
  track: TrackDto;
}

export interface QueueStateDto {
  items: QueueItemDto[];
  current_index: number | null;
  shuffle_mode: boolean;
  repeat_mode: string;
  revision: number;
}

export interface PlaybackStatusDto {
  state: "idle" | "loading" | "playing" | "paused" | "buffering" | "retrying" | "seeking" | "ended" | "error";
  current_track: TrackDto | null;
  position_ms: number;
  duration_ms: number;
  volume: number;
  error_message?: string | null;
}

export interface AlbumDto {
  id: string;
  title: string;
  artist: string;
  year?: number | null;
  track_count: number;
  artwork_path?: string | null;
}

export interface SearchResultDto {
  provider: string;
  remote_id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration_ms: number;
  thumbnail_url?: string | null;
}

export interface AppInfoDto {
  name: string;
  version: string;
  author: string;
  credit: string;
}
