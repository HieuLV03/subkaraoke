"use client";

import TimelineLine from "./TimelineLine";

import type {
    LyricLine
} from "@/stores/lyrics.store";

type Props = {

    lyrics: LyricLine[];

    zoom: number;

    onSelectLine?: (id: string) => void;

};

export default function TimelineTrack({

    lyrics,

    zoom,

    onSelectLine

}: Props) {

    return (

        <div
            className="timeline-track"
            style={{
                width: "100%"
            }}
        >

            {lyrics.map(line => (

                <TimelineLine

                    key={line.id}

                    line={line}

                    zoom={zoom}

                    onSelectLine={onSelectLine}

                />

            ))}

        </div>

    );

}