"use client";

import "./Inspector.css";

import { useLyricsStore } from "@/stores/lyrics.store";

export default function WordEditor() {

    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const selectedLineId = useLyricsStore(
        state => state.selectedLineId
    );

    const line = lyrics.find(
        item => item.id === selectedLineId
    );

    if (!line) {

        return null;

    }

    if (line.words.length === 0) {

        return (

            <section>

                <h3>

                    Word

                </h3>

                <p>

                    This lyric line has no words.

                </p>

            </section>

        );

    }

    const word = line.words[0];

    return (

        <section>

            <h3>

                Word

            </h3>

            <label>

                Text

            </label>

            <input

                value={word.word}

                readOnly

            />

            <label>

                Start

            </label>

            <input

                type="number"

                value={word.start}

                readOnly

            />

            <label>

                End

            </label>

            <input

                type="number"

                value={word.end}

                readOnly

            />

            <label>

                Duration

            </label>

            <input

                readOnly

                value={

                    (

                        word.end - word.start

                    ).toFixed(2)

                }

            />

        </section>

    );

}