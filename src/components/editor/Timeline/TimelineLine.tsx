"use client";

import TimelineWord from "./TimelineWord";

import type {
    LyricLine
} from "@/stores/lyrics.store";

type Props = {

    line: LyricLine;

    zoom: number;

    onSelectLine?: (id: string) => void;

};

export default function TimelineLine({

    line,

    zoom,

    onSelectLine

}: Props) {

    return (

        <div

            className="timeline-line-row"

            onClick={() => {

                onSelectLine?.(line.id);

            }}

        >

            <div

                className="timeline-line-block"

                style={{

                    left: line.start * zoom,

                    width: Math.max(

                        (line.end - line.start) * zoom,

                        200

                    )

                }}

            >

                {(line.words ?? []).map(word => (

                    <TimelineWord

                        key={word.id}

                        lineId={line.id}

                        word={word}

                        lineStart={line.start}

                        zoom={zoom}

                    />

                ))}

            </div>

        </div>

    );

}