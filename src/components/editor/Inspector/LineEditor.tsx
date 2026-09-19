import "./Inspector.css";

import { useLyricsStore } from "@/stores/lyrics.store";

export default function LineEditor() {

    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const selectedLineId = useLyricsStore(
        state => state.selectedLineId
    );

    const updateLine = useLyricsStore(
        state => state.updateLine
    );

    const line = lyrics.find(
        item => item.id === selectedLineId
    );

    if (!line) {

        return (

            <section>

                <h3>Line</h3>

                <p>No line selected.</p>

            </section>

        );

    }

    return (

        <section>

            <h3>

                Line

            </h3>

            <label>

                Text

            </label>

            <textarea

                value={line.text}

                rows={4}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            text:e.target.value

                        }

                    );

                }}

            />

            <label>

                Start

            </label>

            <input

                type="number"

                step="0.01"

                value={line.start}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            start:Number(

                                e.target.value

                            )

                        }

                    );

                }}

            />

            <label>

                End

            </label>

            <input

                type="number"

                step="0.01"

                value={line.end}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            end:Number(

                                e.target.value

                            )

                        }

                    );

                }}

            />

            <label>

                Duration

            </label>

            <input

                readOnly

                value={

                    (

                        line.end-line.start

                    ).toFixed(2)

                }

            />

        </section>

    );

}