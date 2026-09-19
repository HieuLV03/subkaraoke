import { create } from "zustand";

export interface LyricWord {

    id: string;

    word: string;

    start: number;

    end: number;

    synced: boolean;

}

export interface LyricStyle {

    fontFamily: string;

    fontSize: number;

    color: string;

    activeColor: string;

    outline: string;

    outlineWidth: number;

    shadow: boolean;

    x: number;

    y: number;

    align:
        | "left"
        | "center"
        | "right";

}

export interface LyricLine {

    id: string;

    start: number;

    end: number;

    text: string;

    words: LyricWord[];
    style?: LyricStyle;

}

type LyricsState = {
    

    lyrics: LyricLine[];
    hasStartedTiming: boolean;
    isUserEditing: boolean;

    startTiming: () => void;
    startEditing: () => void;
        resetEditorState:()=>void; // thêm dòng này

    selectedLineId: string | null;

    selectedWordId: string | null;

    setLyrics: (
        data: LyricLine[]
    ) => void;
updateLyrics: (
    updater: (
        lyrics: LyricLine[]
    ) => LyricLine[]
) => void;
    selectLine: (
        id: string | null
    ) => void;
moveLine: (
    id: string,
    x: number,
    y: number
) => void;
    selectWord: (
        id: string | null
    ) => void;

    updateLine: (
        id: string,
        data: Partial<LyricLine>
    ) => void;

    updateWord: (
        lineId: string,
        wordId: string,
        data: Partial<LyricWord>
    ) => void;

    addWordToLine: (
        lineId: string,
        word: LyricWord
    ) => void;

    addLineAfter: (
        id: string
    ) => void;

    deleteLine: (
        id: string
    ) => void;

resetSync: () => void;

resetAllTiming: () => void;

resetLastTiming: () => void;
};
export const defaultLyricStyle: LyricStyle = {

    fontFamily: "Arial",

    fontSize:21,

    color: "#ffffff",

    activeColor: "#00ff66",

    outline: "#000000",

    outlineWidth: 2,

    shadow: true,

    x: 330,

    y: 180,

    align: "center"

};
export const useLyricsStore =

create<LyricsState>((set) => ({

    lyrics: [],
     hasStartedTiming:false,
    isUserEditing:false,
    startTiming:()=>{

        set({
            hasStartedTiming:true
        });

    },
startEditing:()=>{

    set({
        isUserEditing:true
    });

},
    selectedLineId: null,

    selectedWordId: null,

setLyrics: (data) => {

set({

lyrics:data.map(line=>({

...line,


style:{
...defaultLyricStyle,
...line.style
},


words:
line.words ?? []


})),

isUserEditing:false

});


},
updateLyrics: (updater) => {

set(state => ({

    lyrics: updater(state.lyrics),

    isUserEditing:true

}));

},
    selectLine: (id) => {

        set({

            selectedLineId: id

        });

    },

    selectWord: (id) => {

        set({

            selectedWordId: id

        });

    },
resetEditorState:()=>{

    set({
        lyrics:[],
        isUserEditing:false,
        hasStartedTiming:false,
        selectedLineId:null,
        selectedWordId:null
    });

},
updateLine: (id, data) => {

    set(state => ({

        lyrics: state.lyrics.map(line => {

            if (line.id !== id) {
                return line;
            }

            return {

                ...line,

                ...data,

                style: {

                    ...defaultLyricStyle,

                    ...line.style,

                    ...data.style

                }

            };

        }),

        isUserEditing:true

    }));

},
moveLine: (id, x, y) => {

set(state => ({

    lyrics: state.lyrics.map(line => {


        if(line.id !== id)
            return line;



        return {

            ...line,

            style: {

                ...defaultLyricStyle,

                ...line.style,

                x,
                y

            }

        };


    }),


    isUserEditing:true

}));

},
updateWord: (

    lineId,

    wordId,

    data

) => {

    set(state => ({

        lyrics:

            state.lyrics.map(line => {

                if(line.id !== lineId){

                    return line;

                }


                return {

                    ...line,

                    words:

                        line.words.map(word =>

                            word.id === wordId

                            ? {

                                ...word,

                                ...data

                            }

                            : word

                        )

                };

            }),

        isUserEditing:true

    }));

},
    addWordToLine: (

        lineId,

        word

    ) => {

        set(state => ({

            lyrics:

                state.lyrics.map(line => {

                    if (line.id !== lineId) {

                        return line;

                    }

                    return {

                        ...line,

                        words: [

                            ...line.words,

                            word

                        ]

                    };

                }),
                isUserEditing:true

        }));

    },

    addLineAfter: (id) => {

        set(state => {

            const index =

                state.lyrics.findIndex(

                    line =>

                        line.id === id

                );

            if (index === -1) {

                return state;

            }

            const current =

                state.lyrics[index];

      const newLine: LyricLine = {

    id: crypto.randomUUID(),

    start: current.end,

    end: current.end + 1,

    text: "New line",

    words: [],

    style: {

        ...defaultLyricStyle

    }

};
            const lyrics = [

                ...state.lyrics

            ];

            lyrics.splice(

                index + 1,

                0,

                newLine

            );

         return {

    lyrics,

    isUserEditing:true,

    selectedLineId:newLine.id,

    selectedWordId:null

};

        });

    },

 deleteLine: (id) => {

    set(state => ({

        lyrics:
            state.lyrics.filter(
                line =>
                    line.id !== id
            ),

        isUserEditing:true,

        selectedLineId:
            state.selectedLineId === id
                ? null
                : state.selectedLineId,

        selectedWordId:null

    }));

},

resetSync: () => {
    set(state => ({
        lyrics: state.lyrics.map(line => ({
            ...line,
            words: line.words.map(word => ({
                ...word,
                synced: false          // chỉ reset flag này
            }))
        }))
    }));
},
resetAllTiming: () => {

    set(state => ({
        lyrics:
            state.lyrics.map(line => ({
                ...line,

                words:
                    line.words.map(word => ({
                        ...word,
                        start: 0,
                        end: 0,
                        synced: false
                    }))

            }))
    }));

},
resetLastTiming: () => {

    set(state => {

        const lyrics = state.lyrics.map(line => ({

            ...line,

            words: [...line.words]

        }));

        let lastLineIndex = -1;
        let lastWordIndex = -1;

        lyrics.forEach((line, lineIndex) => {

            line.words.forEach((word, wordIndex) => {

                if (word.synced) {

                    lastLineIndex = lineIndex;
                    lastWordIndex = wordIndex;

                }

            });

        });

        if (lastLineIndex === -1) {

            return { lyrics };

        }

        lyrics[lastLineIndex].words[lastWordIndex] = {

            ...lyrics[lastLineIndex].words[lastWordIndex],

            start: 0,

            end: 0,

            synced: false

        };

        return {

            lyrics

        };

    });

},
}));