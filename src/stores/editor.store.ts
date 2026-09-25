import { create } from "zustand";


// ============================================================
// TYPES
// ============================================================

export type EditorWorkspace =
    | "line"
    | "timing"
    | "style"
    | "export"
    | "profile";


// ============================================================
// BACKGROUND MEDIA
// ============================================================

export type BackgroundMediaState = {
    x: number;
    y: number;
    scale: number;
};


// ============================================================
// EDITOR STATE
// ============================================================

type EditorState = {

    // ===========================
    // Audio / Video
    // ===========================

    audioRef: HTMLAudioElement | null;

    videoRef: HTMLVideoElement | null;

    currentTime: number;

    duration: number;

    playing: boolean;

    audioFile?: string;

    playbackRate: number;

    volume: number;


    // ===========================
    // Background Media
    // ===========================

    backgroundMedia: BackgroundMediaState;

    setBackgroundMediaPosition: (
        x: number,
        y: number
    ) => void;

    setBackgroundMediaScale: (
        scale: number
    ) => void;

    resetBackgroundMedia: () => void;


    // ===========================
    // Timeline
    // ===========================

    zoom: number;


    // ===========================
    // Selection
    // ===========================

    selectedLine?: string;

    selectedWord?: string;


    // ===========================
    // Workspace
    // ===========================

    currentWorkspace: EditorWorkspace;

    workspaceHistory: EditorWorkspace[];

    setWorkspace: (
        workspace: EditorWorkspace
    ) => void;

    goBackWorkspace: () => void;


    // ===========================
    // Audio Actions
    // ===========================

    setAudioRef: (
        audio: HTMLAudioElement | null
    ) => void;

    setVideoRef: (
        video: HTMLVideoElement | null
    ) => void;

    setCurrentTime: (
        time: number
    ) => void;

    setDuration: (
        time: number
    ) => void;

    play: () => void;

    pause: () => void;

    setAudioFile: (
        path?: string
    ) => void;

    setPlaybackRate: (
        rate: number
    ) => void;

    setVolume: (
        volume: number
    ) => void;

    togglePlay: () => void;


    // ===========================
    // Timeline
    // ===========================

    setZoom: (
        zoom: number
    ) => void;

    zoomIn: () => void;

    zoomOut: () => void;


    // ===========================
    // Selection
    // ===========================

    selectLine: (
        id?: string
    ) => void;

    selectWord: (
        id?: string
    ) => void;


    // ===========================
    // Reset
    // ===========================

    reset: () => void;
};


// ============================================================
// CONSTANT
// ============================================================

const DEFAULT_BACKGROUND_MEDIA: BackgroundMediaState = {
    x: 320,
    y: 180,
    scale: 1,
};


// ============================================================
// STORE
// ============================================================

export const useEditorStore =
    create<EditorState>((set, get) => ({

        // ====================================================
        // STATE
        // ====================================================

        audioRef: null,

        videoRef: null,

        currentTime: 0,

        duration: 0,

        playing: false,

        audioFile: undefined,

        playbackRate: 1,

        volume: 1,


        // ====================================================
        // BACKGROUND MEDIA
        // ====================================================

        backgroundMedia: {
            ...DEFAULT_BACKGROUND_MEDIA,
        },


        // ====================================================
        // TIMELINE
        // ====================================================

        zoom: 120,


        // ====================================================
        // SELECTION
        // ====================================================

        selectedLine: undefined,

        selectedWord: undefined,


        // ====================================================
        // WORKSPACE
        // ====================================================

        currentWorkspace: "line",

        workspaceHistory: [],


        // ====================================================
        // AUDIO
        // ====================================================

        setAudioRef: (audio) =>
            set({
                audioRef: audio,
            }),


        setVideoRef: (video) =>
            set({
                videoRef: video,
            }),


        setCurrentTime: (time) =>
            set({
                currentTime: time,
            }),


        setDuration: (time) =>
            set({
                duration: time,
            }),


        play: () =>
            set({
                playing: true,
            }),


        pause: () =>
            set({
                playing: false,
            }),


        setAudioFile: (path) =>
            set({
                audioFile: path,
            }),


        setPlaybackRate: (rate) =>
            set({
                playbackRate: rate,
            }),


        setVolume: (volume) =>
            set({
                volume,
            }),


        togglePlay: () =>
            set((state) => ({
                playing: !state.playing,
            })),


        // ====================================================
        // BACKGROUND MEDIA ACTIONS
        // ====================================================

        setBackgroundMediaPosition: (
            x,
            y
        ) =>
            set((state) => ({
                backgroundMedia: {
                    ...state.backgroundMedia,

                    x,

                    y,
                },
            })),


        setBackgroundMediaScale: (
            scale
        ) =>
            set((state) => ({
                backgroundMedia: {
                    ...state.backgroundMedia,

                    scale: Math.max(
                        0.1,
                        Math.min(
                            5,
                            scale
                        )
                    ),
                },
            })),


        resetBackgroundMedia: () =>
            set({
                backgroundMedia: {
                    ...DEFAULT_BACKGROUND_MEDIA,
                },
            }),


        // ====================================================
        // TIMELINE
        // ====================================================

        setZoom: (zoom) =>
            set({
                zoom: Math.max(
                    20,
                    Math.min(
                        500,
                        zoom
                    )
                ),
            }),


        zoomIn: () =>
            set((state) => ({
                zoom: Math.min(
                    500,
                    state.zoom + 20
                ),
            })),


        zoomOut: () =>
            set((state) => ({
                zoom: Math.max(
                    20,
                    state.zoom - 20
                ),
            })),


        // ====================================================
        // SELECTION
        // ====================================================

        selectLine: (id) =>
            set({
                selectedLine: id,
            }),


        selectWord: (id) =>
            set({
                selectedWord: id,
            }),


        // ====================================================
        // WORKSPACE
        // ====================================================

        setWorkspace: (
            workspace
        ) =>
            set((state) => {

                if (
                    state.currentWorkspace ===
                    workspace
                ) {
                    return state;
                }

                return {

                    currentWorkspace:
                        workspace,

                    workspaceHistory: [
                        ...state.workspaceHistory,

                        state.currentWorkspace,
                    ],

                };

            }),


        goBackWorkspace: () =>
            set((state) => {

                if (
                    state.workspaceHistory.length ===
                    0
                ) {
                    return state;
                }

                const history =
                    [
                        ...state.workspaceHistory,
                    ];

                const previousWorkspace =
                    history.pop();

                return {

                    currentWorkspace:
                        previousWorkspace ??
                        "line",

                    workspaceHistory:
                        history,

                };

            }),


        // ====================================================
        // RESET
        // ====================================================

        reset: () =>
            set({

                audioRef: null,

                videoRef: null,

                audioFile: undefined,

                playbackRate: 1,

                volume: 1,

                currentTime: 0,

                duration: 0,

                playing: false,

                zoom: 120,

                selectedLine: undefined,

                selectedWord: undefined,

                currentWorkspace: "line",

                workspaceHistory: [],

                backgroundMedia: {
                    ...DEFAULT_BACKGROUND_MEDIA,
                },

            }),

    }));