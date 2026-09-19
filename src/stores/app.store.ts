import { create } from "zustand";

export type WorkspaceState =
  | "home"
  | "processing"
  | "editor";

interface AppState {

  // ===== App =====

  appName: string;

  version: string;

  theme: "dark" | "light";

  // ===== Project =====

  currentProject: string | null;

  // ===== Workspace =====

  workspace: WorkspaceState;

  // ===== Loading =====

  isLoading: boolean;

  progress: number;

  progressMessage: string;

  // ===== Actions =====

  setLoading: (
    value: boolean
  ) => void;

  setProject: (
    project: string | null
  ) => void;

  setTheme: (
    theme: "dark" | "light"
  ) => void;

  setWorkspace: (
    workspace: WorkspaceState
  ) => void;

  setProgress: (
    progress: number,
    message: string
  ) => void;

}

export const useAppStore =
create<AppState>((set) => ({

  // ===== App =====

  appName: "SubKaraokeAI",

  version: "1.0.0",

  theme: "dark",

  // ===== Project =====

  currentProject: null,

  // ===== Workspace =====

  workspace: "home",

  // ===== Loading =====

  isLoading: false,

  progress: 0,

  progressMessage: "",

  // ===== Actions =====

  setLoading: (value) =>
    set({
      isLoading: value
    }),

  setProject: (project) =>
    set({
      currentProject: project
    }),

  setTheme: (theme) =>
    set({
      theme
    }),

  setWorkspace: (workspace) =>
    set({
      workspace
    }),

  setProgress: (
    progress,
    message
  ) =>
    set({
      progress,
      progressMessage: message
    }),

}));