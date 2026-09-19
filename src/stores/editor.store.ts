import { create } from "zustand";


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
    // Audio Actions
    // ===========================
currentWorkspace: EditorWorkspace;

workspaceHistory: EditorWorkspace[];

setWorkspace: (
    workspace: EditorWorkspace
) => void;

goBackWorkspace: () => void;

    setAudioRef:
    (
        audio: HTMLAudioElement | null
    ) => void;

setVideoRef: (
    video: HTMLVideoElement | null
) => void;
    setCurrentTime:
    (
        time:number
    )=>void;


    setDuration:
    (
        time:number
    )=>void;


    play:
    ()=>void;


    pause:
    ()=>void;



    setAudioFile:
    (
        path?:string
    )=>void;



    setPlaybackRate:
    (
        rate:number
    )=>void;



    setVolume:
    (
        volume:number
    )=>void;



    togglePlay:
    ()=>void;




    // ===========================
    // Timeline
    // ===========================


    setZoom:
    (
        zoom:number
    )=>void;


    zoomIn:
    ()=>void;


    zoomOut:
    ()=>void;



    // ===========================
    // Selection
    // ===========================


    selectLine:
    (
        id?:string
    )=>void;


    selectWord:
    (
        id?:string
    )=>void;



    reset:
    ()=>void;


};



export type EditorWorkspace =
    | "line"
    | "timing"
    | "style"
    | "export"
    | "profile";

export const useEditorStore =
create<EditorState>((set,get)=>(


{


    // ===========================
    // State
    // ===========================


    audioRef:null,
videoRef: null,

    currentTime:0,


    duration:0,


    playing:false,


    audioFile:undefined,


    playbackRate:1,


    volume:1,



    zoom:120,



    selectedLine:undefined,


    selectedWord:undefined,

currentWorkspace: "line",

workspaceHistory: [],

    // ===========================
    // Audio
    // ===========================



    setAudioRef:(audio)=>set({

        audioRef:audio

    }),


setVideoRef: (video) => set({
    videoRef: video
}),

    setCurrentTime:(time)=>set({

        currentTime:time

    }),




    setDuration:(time)=>set({

        duration:time

    }),





    play:()=>set({

        playing:true

    }),





    pause:()=>set({

        playing:false

    }),





    setAudioFile:(path)=>set({

        audioFile:path

    }),





    setPlaybackRate:(rate)=>set({

        playbackRate:rate

    }),





    setVolume:(volume)=>set({

        volume

    }),





    togglePlay:()=>set(state=>({


        playing:
        !state.playing


    })),






    // ===========================
    // Timeline
    // ===========================


    setZoom:(zoom)=>set({


        zoom:Math.max(

            20,

            Math.min(
                500,
                zoom
            )

        )


    }),




    zoomIn:()=>set(state=>({


        zoom:Math.min(

            500,

            state.zoom + 20

        )


    })),





    zoomOut:()=>set(state=>({


        zoom:Math.max(

            20,

            state.zoom - 20

        )


    })),






    // ===========================
    // Selection
    // ===========================


    selectLine:(id)=>set({

        selectedLine:id

    }),





    selectWord:(id)=>set({

        selectedWord:id

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


    reset:()=>set({


        audioRef:null,


        audioFile:undefined,


        playbackRate:1,


        volume:1,


        currentTime:0,


        duration:0,


        playing:false,


        zoom:120,


        selectedLine:undefined,


        selectedWord:undefined,

        currentWorkspace:"line",
workspaceHistory: [],

    })



}));