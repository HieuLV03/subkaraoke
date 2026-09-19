
export interface LyricWord {

  id: string;

  text: string;

  start: number;

  end: number;

}

export interface LyricLine {

  id: string;

  start: number;

  end: number;

  text: string;

  words: LyricWord[];

}

export interface KaraokeProject {

  id: string;

  name: string;

  // ==========================================================
  // MEDIA
  // ==========================================================

  // Audio riêng nếu project sử dụng audio
  audioFile: string | null;

  // Video nguồn:
  // - dùng để nghe nhạc
  // - dùng để timing karaoke
  // - KHÔNG nhất thiết là background khi export
  videoFile: string | null;

  // Ảnh background:
  // - dùng làm nền cho Image Project
  // - được kéo dài theo duration của video
  imageFile: string | null;

  // ==========================================================
  // AI / KARAOKE
  // ==========================================================

  vocalFile: string | null;

  instrumentalFile: string | null;

  lyricFile: string | null;

  // ==========================================================
  // OUTPUT
  // ==========================================================

  outputFolder: string | null;

  duration: number;

  lyrics: LyricLine[];

  // ==========================================================
  // TIMESTAMP
  // ==========================================================

  createdAt: Date;

  updatedAt: Date;

}
