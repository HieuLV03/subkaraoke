"use client";

import "./Timeline.css";

import TimelineHeader from "./TimelineHeader";
import TimelineCursor from "./TimelineCursor";
import TimelineTrack from "./TimelineTrack";

import { useLyricsStore } from "@/stores/lyrics.store";
import { useEditorStore } from "@/stores/editor.store";

export default function Timeline() {

    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const selectLine = useLyricsStore(
        state => state.selectLine
    );

    const duration = useEditorStore(
        state => state.duration
    );

    const zoom = useEditorStore(
        state => state.zoom
    );

    return (

        <div className="timeline">

            <TimelineHeader
                duration={duration}
                zoom={zoom}
            />

            <div className="timeline-body">

                <TimelineCursor />

                <TimelineTrack
                    lyrics={lyrics}
                    zoom={zoom}
                    onSelectLine={selectLine}
                />

            </div>

        </div>

    );

}