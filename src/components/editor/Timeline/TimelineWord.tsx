"use client";

import { memo } from "react";

import {
    useLyricsStore,
    type LyricWord
} from "@/stores/lyrics.store";

type Props = {

    lineId: string;

    word: LyricWord;

    lineStart: number;

    zoom: number;

};

function TimelineWord({

    lineId,

    word,

    lineStart,

    zoom

}: Props) {

    const updateWord = useLyricsStore(
        state => state.updateWord
    );

    const left =
        (word.start - lineStart) * zoom;

    const width =
        Math.max(
            (word.end - word.start) * zoom,
            40
        );

    return (

        <div
            className="timeline-word"
            style={{
                left,
                width
            }}
        >

            <div
                style={{
                    fontSize: 12,
                    marginBottom: 4
                }}
            >
                {word.word}
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 4
                }}
            >

                <input
                    type="number"
                    step="0.01"
                    value={word.start}
                    style={{
                        width: 60
                    }}
                    onChange={(e) => {

                        updateWord(

                            lineId,

                            word.id,

                            {

                                start: Number(
                                    e.target.value
                                )

                            }

                        );

                    }}
                />

                <input
                    type="number"
                    step="0.01"
                    value={word.end}
                    style={{
                        width: 60
                    }}
                    onChange={(e) => {

                        updateWord(

                            lineId,

                            word.id,

                            {

                                end: Number(
                                    e.target.value
                                )

                            }

                        );

                    }}
                />

            </div>

        </div>

    );

}

export default memo(TimelineWord);