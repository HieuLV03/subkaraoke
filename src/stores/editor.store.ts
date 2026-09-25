import { create } from "zustand";


// ============================================================
// BACKGROUND MEDIA
// ============================================================

export type BackgroundMediaState = {
    x: number;
    y: number;
    scale: number;
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
// EDITOR STATE
// ============================================================

type EditorState = {

    // ===========================
    // Audio / Video
    // ===========================

    audioRef:
        HTMLAudioElement | null;

    videoRef:
        HTMLVideoElement | null;

    currentTime:
        number;

    duration:
        number;

    playing:
        boolean;

    audioFile?:
        string;

    playbackRate:
        number;

    volume:
        number;


    // ===========================
    // Background Media
    // ===========================

    backgroundMedia:
        BackgroundMediaState;


    // ===========================
    // Timeline
    // ===========================

    zoom:
        number;


    // ===========================
    // Selection
    // ===========================

    selectedLine?:
        string;

    selectedWord?:
        string;


    // ===========================
    // Workspace
    // ===========================

    currentWorkspace:
        EditorWorkspace;

    workspaceHistory:
        EditorWorkspace[];


    // ===========================
    // Audio Actions
    // ===========================

    setAudioRef:
        (
            audio: HTMLAudioElement | null
        ) => void;

    setVideoRef:
        (
            video: HTMLVideoElement | null
        ) => void;

    setCurrentTime:
        (
            time: number
        ) => void;

    setDuration:
        (
            time: number
        ) => void;

    play:
        () => void;

    pause:
        () => void;

    setAudioFile:
        (
            path?: string
        ) => void;

    setPlaybackRate:
        (
            rate: number
        ) => void;

    setVolume:
        (
            volume: number
        ) => void;

    togglePlay:
        () => void;


    // ===========================
    // Background Media Actions
    // ===========================

    setBackgroundMediaPosition:
        (
            x: number,
            y: number
        ) => void;

    setBackgroundMediaScale:
        (
            scale: number
        ) => void;

    resetBackgroundMedia:
        () => void;


    // ===========================
    // Timeline
    // ===========================

    setZoom:
        (
            zoom: number
        ) => void;

    zoomIn:
        () => void;

    zoomOut:
        () => void;


    // ===========================
    // Selection
    // ===========================

    selectLine:
        (
            id?: string
        ) => void;

    selectWord:
        (
            id?: string
        ) => void;


    // ===========================
    // Workspace
    // ===========================

    setWorkspace:
        (
            workspace: EditorWorkspace
        ) => void;

    goBackWorkspace:
        () => void;


    // ===========================
    // Reset
    // ===========================

    reset:
        () => void;
};


// ============================================================
// DEFAULT BACKGROUND MEDIA
// ============================================================

const DEFAULT_BACKGROUND_MEDIA:
    BackgroundMediaState = {

    x: 320,

    y: 180,

    scale: 1,

};


// ============================================================
// STORE
// ============================================================

export const useEditorStore =
    create<EditorState>(
        (set, get) => ({

            // ==================================================
            // State
            // ==================================================

            audioRef:
                null,

            videoRef:
                null,

            currentTime:
                0,

            duration:
                0,

            playing:
                false,

            audioFile:
                undefined,

            playbackRate:
                1,

            volume:
                1,


            // ==================================================
            // Background Media
            // ==================================================

            backgroundMedia:
                {
                    ...DEFAULT_BACKGROUND_MEDIA,
                },


            // ==================================================
            // Timeline
            // ==================================================

            zoom:
                120,


            // ==================================================
            // Selection
            // ==================================================

            selectedLine:
                undefined,

            selectedWord:
                undefined,


            // ==================================================
            // Workspace
            // ==================================================

            currentWorkspace:
                "line",

            workspaceHistory:
                [],


            // ==================================================
            // Audio
            // ==================================================

            setAudioRef:
                (audio) =>
                    set({
                        audioRef:
                            audio,
                    }),


            setVideoRef:
                (video) =>
                    set({
                        videoRef:
                            video,
                    }),


            setCurrentTime:
                (time) =>
                    set({
                        currentTime:
                            time,
                    }),


            setDuration:
                (time) =>
                    set({
                        duration:
                            time,
                    }),


            play:
                () =>
                    set({
                        playing:
                            true,
                    }),


            pause:
                () =>
                    set({
                        playing:
                            false,
                    }),


            setAudioFile:
                (path) =>
                    set({
                        audioFile:
                            path,
                    }),


            setPlaybackRate:
                (rate) =>
                    set({
                        playbackRate:
                            rate,
                    }),


            setVolume:
                (volume) =>
                    set({
                        volume,
                    }),


            togglePlay:
                () =>
                    set(
                        (state) => ({
                            playing:
                                !state.playing,
                        })
                    ),


            // ==================================================
            // Background Media
            // ==================================================

            setBackgroundMediaPosition:
                (x, y) =>
                    set({
                        backgroundMedia: {
                            ...get()
                                .backgroundMedia,

                            x,

                            y,
                        },
                    }),


            setBackgroundMediaScale:
                (scale) =>
                    set({
                        backgroundMedia: {
                            ...get()
                                .backgroundMedia,

                            /*
                             * Không cho scale
                             * xuống <= 0.
                             */

                            scale:
                                Math.max(
                                    0.1,
                                    scale
                                ),
                        },
                    }),


            resetBackgroundMedia:
                () =>
                    set({
                        backgroundMedia: {
                            ...DEFAULT_BACKGROUND_MEDIA,
                        },
                    }),


            // ==================================================
            // Timeline
            // ==================================================

            setZoom:
                (zoom) =>
                    set({
                        zoom:
                            Math.max(
                                20,
                                Math.min(
                                    500,
                                    zoom
                                )
                            ),
                    }),


            zoomIn:
                () =>
                    set(
                        (state) => ({
                            zoom:
                                Math.min(
                                    500,
                                    state.zoom +
                                        20
                                ),
                        })
                    ),


            zoomOut:
                () =>
                    set(
                        (state) => ({
                            zoom:
                                Math.max(
                                    20,
                                    state.zoom -
                                        20
                                ),
                        })
                    ),


            // ==================================================
            // Selection
            // ==================================================

            selectLine:
                (id) =>
                    set({
                        selectedLine:
                            id,
                    }),


            selectWord:
                (id) =>
                    set({
                        selectedWord:
                            id,
                    }),


            // ==================================================
            // Workspace
            // ==================================================

            setWorkspace:
                (workspace) =>
                    set(
                        (state) => {

                            if (
                                state.currentWorkspace ===
                                workspace
                            ) {
                                return state;
                            }


                            return {

                                currentWorkspace:
                                    workspace,

                                workspaceHistory:
                                    [
                                        ...state.workspaceHistory,

                                        state.currentWorkspace,
                                    ],

                            };

                        }
                    ),


            goBackWorkspace:
                () =>
                    set(
                        (state) => {

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

                        }
                    ),


            // ==================================================
            // Reset
            // ==================================================

            reset:
                () =>
                    set({

                        audioRef:
                            null,

                        videoRef:
                            null,

                        audioFile:
                            undefined,

                        playbackRate:
                            1,

                        volume:
                            1,

                        currentTime:
                            0,

                        duration:
                            0,

                        playing:
                            false,

                        zoom:
                            120,

                        selectedLine:
                            undefined,

                        selectedWord:
                            undefined,

                        backgroundMedia:
                            {
                                ...DEFAULT_BACKGROUND_MEDIA,
                            },

                        currentWorkspace:
                            "line",

                        workspaceHistory:
                            [],

                    }),

        })
    );