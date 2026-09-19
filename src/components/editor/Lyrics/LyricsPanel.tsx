"use client";

import { useLyricsStore } from "@/stores/lyrics.store";

import "./LyricsPanel.css";


export default function LyricsPanel(){

const updateWord = useLyricsStore(
    state => state.updateWord
);
    const lyrics = useLyricsStore(
        state=>state.lyrics
    );


    const updateLine = useLyricsStore(
        state=>state.updateLine
    );


    const addLineAfter = useLyricsStore(
        state=>state.addLineAfter
    );


    const deleteLine = useLyricsStore(
        state=>state.deleteLine
    );



    return (

        <div className="lyrics-panel">


        {
            lyrics.map(line=>(


                <div
                    key={line.id}
                    className="lyrics-line"
                >


                    <div className="lyrics-header">


                        <button

                        onClick={()=>{

                            addLineAfter(
                                line.id
                            );

                        }}

                        >

                        + Add Below

                        </button>



                        <button

                        onClick={()=>{

                            deleteLine(
                                line.id
                            );

                        }}

                        >

                        Delete

                        </button>


                    </div>





                    <div className="lyrics-time">


                        <label>

                        Start:

                        <input

                        type="number"

                        step="0.001"

                        value={line.start}

                        onChange={(e)=>{

                            updateLine(

                                line.id,

                                {
                                    start:
                                    Number(
                                        e.target.value
                                    )
                                }

                            )

                        }}

                        />

                        </label>





                        <label>

                        End:

                        <input

                        type="number"

                        step="0.001"

                        value={line.end}

                        onChange={(e)=>{

                            updateLine(

                                line.id,

                                {
                                    end:
                                    Number(
                                        e.target.value
                                    )
                                }

                            )

                        }}

                        />

                        </label>



                    </div>






                    <input

                    className="lyrics-text-input"

                    value={line.text}

                    onChange={(e)=>{


                        updateLine(

                            line.id,

                            {
                                text:e.target.value
                            }

                        );


                    }}

                    />

<div className="lyrics-style">

    <label>

        Text

        <input
            type="color"
            value={line.style?.color ?? "#ffffff"}
            onChange={(e)=>{

                updateLine(

                    line.id,

                    {

                        style:{

                            ...line.style!,

                            color:e.target.value

                        }

                    }

                );

            }}
        />

    </label>



    <label>

        Active

        <input
            type="color"
            value={line.style?.activeColor ?? "#00ff66"}
            onChange={(e)=>{

                updateLine(

                    line.id,

                    {

                        style:{

                            ...line.style!,

                            activeColor:e.target.value

                        }

                    }

                );

            }}
        />

    </label>



    <label>

        Outline

        <input
            type="color"
            value={line.style?.outline ?? "#000000"}
            onChange={(e)=>{

                updateLine(

                    line.id,

                    {

                        style:{

                            ...line.style!,

                            outline:e.target.value

                        }

                    }

                );

            }}
        />

    </label>

</div>

<div className="words">

{
    line.words.map(word => (

        <div
            key={word.id}
            className="lyrics-word"
        >

            <input
                value={word.word}
                readOnly
            />

            <input
                type="number"
                step="0.001"
                value={word.start}
                onChange={(e)=>{

                    updateWord(

                        line.id,

                        word.id,

                        {

                            start:Number(
                                e.target.value
                            )

                        }

                    );

                }}
            />

            <input
                type="number"
                step="0.001"
                value={word.end}
                onChange={(e)=>{

                    updateWord(

                        line.id,

                        word.id,

                        {

                            end:Number(
                                e.target.value
                            )

                        }

                    );

                }}
            />

            <span>

                {word.synced
                    ? "✓"
                    : "○"}

            </span>

        </div>

    ))
}

</div>

                </div>


            ))
        }


        </div>

    );

}