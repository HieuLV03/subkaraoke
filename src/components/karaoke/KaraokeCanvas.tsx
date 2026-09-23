
"use client";

import "./KaraokeCanvas.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import SubtitleLine from "../editor/Preview/SubtitleLine";

import {
    useLyricsStore,
} from "@/stores/lyrics.store";

import {
    useEditorStore,
} from "@/stores/editor.store";


// ============================================================
// DESIGN SIZE
// ============================================================

const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 360;


// ============================================================
// COMPONENT
// ============================================================

export default function KaraokeCanvas() {

    // ========================================================
    // STORE
    // ========================================================

    const lyrics =
        useLyricsStore(
            (state) =>
                state.lyrics
        );

    const currentTime =
        useEditorStore(
            (state) =>
                state.currentTime
        );


    // ========================================================
    // REF
    // ========================================================

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );


    // ========================================================
    // SCALE
    // ========================================================

    const [
        scale,
        setScale
    ] = useState(1);


    // ========================================================
    // CALCULATE SCALE
    // ========================================================

    useEffect(() => {

        const container =
            containerRef.current;

        if (!container) {
            return;
        }


        const updateScale =
            () => {

                const width =
                    container.clientWidth;

                const height =
                    container.clientHeight;


                if (
                    width <= 0 ||
                    height <= 0
                ) {
                    return;
                }


                const scaleX =
                    width /
                    DESIGN_WIDTH;


                const scaleY =
                    height /
                    DESIGN_HEIGHT;


                const nextScale =
                    Math.min(
                        scaleX,
                        scaleY
                    );


                setScale(
                    nextScale
                );

            };


        updateScale();


        const observer =
            new ResizeObserver(
                updateScale
            );


        observer.observe(
            container
        );


        return () => {

            observer.disconnect();

        };

    }, []);


    // ========================================================
    // CURRENT LINES
    // ========================================================

    const currentLines =
        lyrics.filter(
            (line) =>
                currentTime >=
                    line.start &&
                currentTime <=
                    line.end
        );


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div
            ref={containerRef}
            className="karaoke-canvas-container"
        >

            <div
                className="karaoke-canvas"
                style={{
                    transform:
                        `translate(-50%, -50%) scale(${scale})`,
                }}
            >

                <div className="karaoke-lyrics-layer">

                    {currentLines.length === 0 && (

                        <div className="waiting-text">

                            Waiting lyric...

                        </div>

                    )}


                    {currentLines.map(
                        (line) => (

                            <SubtitleLine

                                key={
                                    line.id
                                }

                                line={
                                    line
                                }

                                currentTime={
                                    currentTime
                                }

                                color={
                                    "#ffffff"
                                }

                                activeColor={
                                    "#00ff66"
                                }

                            />

                        )
                    )}

                </div>

            </div>

        </div>

    );
}
