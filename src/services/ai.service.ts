import { ipc } from "./ipc.service";

export interface GenerateLyricsRequest {
  audioFile: string;
}

export interface GenerateLyricsResponse {
  started: boolean;
  error?: string;
}

export interface ProgressEvent {
  progress: number;
  message: string;
}

export interface AIWord {
  word: string;
  start: number;
  end: number;
}

export interface AILyricLine {
  start: number;
  end: number;
  text: string;
  words: AIWord[];
}

export function generateLyrics(
  data: GenerateLyricsRequest
) {
  return ipc.invoke<GenerateLyricsResponse>(
    "ai:generateLyrics",
    data
  );
}

export function onAIProgress(
  callback: (event: ProgressEvent) => void
) {
  return ipc.on<ProgressEvent>(
    "ai:progress",
    callback
  );
}

export function onAICompleted(
  callback: (lyrics: AILyricLine[]) => void
) {
  return ipc.on<AILyricLine[]>(
    "lyrics-result",
    callback
  );
}