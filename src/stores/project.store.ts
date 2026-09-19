
import { create } from "zustand";

import {
  KaraokeProject,
  LyricLine,
} from "@/types/project";

interface ProjectState {
  project: KaraokeProject | null;

  createProject: (name: string) => void;

  setAudioFile: (audioFile: string) => void;

  setVideoFile: (videoFile: string) => void;

  setImageFile: (imageFile: string) => void;

  setLyrics: (lyrics: LyricLine[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,

  createProject: (name) =>
    set({
      project: {
        id: crypto.randomUUID(),

        name,

        // ======================================================
        // MEDIA
        // ======================================================

        audioFile: null,

        // Video dùng làm nguồn nghe / timing
        videoFile: null,

        // Image dùng làm background cho Image Project
        imageFile: null,

        // ======================================================
        // AI / KARAOKE
        // ======================================================

        vocalFile: null,

        instrumentalFile: null,

        lyricFile: null,

        // ======================================================
        // OUTPUT
        // ======================================================

        outputFolder: null,

        duration: 0,

        lyrics: [],

        createdAt: new Date(),

        updatedAt: new Date(),
      },
    }),

  // ============================================================
  // AUDIO
  // ============================================================

  setAudioFile: (audioFile) =>
    set((state) => {

      if (!state.project) {
        return state;
      }

      return {
        project: {
          ...state.project,

          audioFile,

          updatedAt: new Date(),
        },
      };
    }),

  // ============================================================
  // VIDEO
  // Video dùng làm nguồn nghe / timing
  // ============================================================

  setVideoFile: (videoFile) =>
    set((state) => {

      if (!state.project) {
        return state;
      }

      return {
        project: {
          ...state.project,

          videoFile,

          updatedAt: new Date(),
        },
      };
    }),

  // ============================================================
  // IMAGE
  // Image dùng làm background
  // ============================================================

  setImageFile: (imageFile) =>
    set((state) => {

      if (!state.project) {
        return state;
      }

      return {
        project: {
          ...state.project,

          imageFile,

          updatedAt: new Date(),
        },
      };
    }),

  // ============================================================
  // LYRICS
  // ============================================================

  setLyrics: (lyrics) =>
    set((state) => {

      if (!state.project) {
        return state;
      }

      return {
        project: {
          ...state.project,

          lyrics,

          updatedAt: new Date(),
        },
      };
    }),
}));
