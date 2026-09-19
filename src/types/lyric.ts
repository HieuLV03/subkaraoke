export interface LyricLine {
  id: string;

  start: number;

  end: number;

  text: string;
}

export interface LyricsFile {
  title: string;

  artist: string;

  lines: LyricLine[];
}