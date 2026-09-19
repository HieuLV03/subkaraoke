import {
    useLyricsStore
} from "../stores/lyrics.store";


import type {
    LyricLine
} from "../stores/lyrics.store";



interface WhisperWord {

    word: string;

    start: number;

    end: number;

}



interface WhisperSegment {

    id?: string;

    start: number;

    end: number;

    text: string;

    words?: WhisperWord[];

}




export function registerAIListener(){

    console.log(
        "REGISTER AI LISTENER"
    );


    const handler = (
        data: WhisperSegment[]
    )=>{


        console.log(
            "RAW LYRICS:",
            data
        );


        const lines: LyricLine[] = data.map(
            (
                segment,
                index
            )=>{

                return {

                    id:String(index),

                    start:Number(
                        segment.words?.[0]?.start
                        ?? segment.start
                    ),

                    end:Number(
                        segment.words?.[
                            segment.words.length - 1
                        ]?.end
                        ?? segment.end
                    ),

                    text:segment.text ?? "",

                    words:
                    segment.words?.map(
                        (
                            item,
                            wordIndex
                        )=>({

                            id:`${index}-${wordIndex}`,

                            word:String(item.word).trim(),

                            start:Number(item.start),

                            end:Number(item.end),

                            synced:false

                        })
                    ) ?? []

                };

            }
        );


        const store =
        useLyricsStore.getState();


        if(store.isUserEditing){

            console.log(
                "BLOCK OLD AI LYRICS"
            );

            return;

        }


        store.setLyrics(lines);

    };


const cleanup =
    window.electronAPI.on(
        "lyrics-result",
        handler
    );


return cleanup;
}