import { create } from "zustand";


// ============================================================
// BACKGROUND IMAGE TYPE
// ============================================================

export type BackgroundImageState = {
    x: number;
    y: number;
    scale: number;
};


// ============================================================
// EDITOR STATE
// ============================================================

type EditorState = {


    // ===========================
    // Audio
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
    // Timeline
    // ===========================

    zoom: number;


    // ===========================
    // Selection
    // ===========================

    selectedLine?: string;

    selectedWord?: string;


    // ===========================
    // Background Image
    // ===========================

    backgroundImage: BackgroundImageState;


    // ===========================
    // Audio Actions
    // ===========================

    currentWorkspace: EditorWorkspace;

    workspaceHistory: EditorWorkspace[];

    setWorkspace: (
        workspace: EditorWorkspace
    ) => void;

    goBackWorkspace: () => void;

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
    // Background Image Actions
    // ===========================

    setBackgroundImagePosition: (
        x: number,
        y: number
    ) => void;

    setBackgroundImageScale: (
        scale: number
    ) => void;

    resetBackgroundImage: () => void;


    // ===========================
    // Reset
    // ===========================

    reset: () => void;

};


// ============================================================
// WORKSPACE
// ============================================================

export type EditorWorkspace =
    | "line"
    | "timing"
    | "style"
    | "export"
    | "profile";


// ============================================================
// STORE
// ============================================================

export const useEditorStore =
    create<EditorState>((set, get) => ({

        // ===========================
        // State
        // ===========================

        audioRef: null,

        videoRef: null,

        currentTime: 0,

        duration: 0,

        playing: false,

        audioFile: undefined,

        playbackRate: 1,

        volume: 1,

        zoom: 120,

        selectedLine: undefined,

        selectedWord: undefined,


        // ===========================
        // Background Image State
        // ===========================

        backgroundImage: {
            x: 320,
            y: 180,
            scale: 1,
        },


        // ===========================
        // Workspace State
        // ===========================

        currentWorkspace: "line",

        workspaceHistory: [],


        // ===========================
        // Audio
        // ===========================

        setAudioRef: (audio) => set({
            audioRef: audio
        }),


        setVideoRef: (video) => set({
            videoRef: video
        }),


        setCurrentTime: (time) => set({
            currentTime: time
        }),


        setDuration: (time) => set({
            duration: time
        }),


        play: () => set({
            playing: true
        }),


        pause: () => set({
            playing: false
        }),


        setAudioFile: (path) => set({
            audioFile: path
        }),


        setPlaybackRate: (rate) => set({
            playbackRate: rate
        }),


        setVolume: (volume) => set({
            volume
        }),


        togglePlay: () => set(state => ({
            playing: !state.playing
        })),


        // ===========================
        // Timeline
        // ===========================

        setZoom: (zoom) => set({
            zoom: Math.max(
                20,
                Math.min(
                    500,
                    zoom
                )
            )
        }),


        zoomIn: () => set(state => ({
            zoom: Math.min(
                500,
                state.zoom + 20
            )
        })),


        zoomOut: () => set(state => ({
            zoom: Math.max(
                20,
                state.zoom - 20
            )
        })),


        // ===========================
        // Selection
        // ===========================

        selectLine: (id) => set({
            selectedLine: id
        }),


        selectWord: (id) => set({
            selectedWord: id
        }),


        // ===========================
        // Background Image
        // ===========================

        setBackgroundImagePosition: (x, y) =>
            set({
                backgroundImage: {
                    ...get().backgroundImage,
                    x,
                    y,
                },
            }),


        setBackgroundImageScale: (scale) =>
            set({
                backgroundImage: {
                    ...get().backgroundImage,
                    scale: Math.max(
                        0.1,
                        scale
                    ),
                },
            }),


        resetBackgroundImage: () =>
            set({
                backgroundImage: {
                    x: 320,
                    y: 180,
                    scale: 1,
                },
            }),


        // ===========================
        // Workspace
        // ===========================

        setWorkspace: (workspace) =>
            set((state) => {

                // Nếu đã ở workspace này thì không làm gì
                if (
                    state.currentWorkspace === workspace
                ) {
                    return state;
                }

                return {
                    currentWorkspace: workspace,

                    workspaceHistory: [
                        ...state.workspaceHistory,
                        state.currentWorkspace,
                    ],
                };

            }),


        goBackWorkspace: () =>
            set((state) => {

                // Không có lịch sử để quay lại
                if (
                    state.workspaceHistory.length === 0
                ) {
                    return state;
                }

                const history =
                    [...state.workspaceHistory];

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


        // ===========================
        // Reset
        // ===========================

        reset: () => set({

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


            // Reset background image
            backgroundImage: {
                x: 320,
                y: 180,
                scale: 1,
            },


            currentWorkspace: "line",

            workspaceHistory: [],

        })


    }));