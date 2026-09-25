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

import {
    useProjectStore,
} from "@/stores/project.store";


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

    const backgroundImage =
        useEditorStore(
            (state) =>
                state.backgroundImage
        );

    const setBackgroundImagePosition =
        useEditorStore(
            (state) =>
                state.setBackgroundImagePosition
        );

    const imageFile =
        useProjectStore(
            (state) =>
                state.project?.imageFile
        );


    // ========================================================
    // REF
    // ========================================================

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const imageRef =
        useRef<HTMLImageElement | null>(
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
    // DRAG STATE
    // ========================================================

    const dragRef =
        useRef<{
            pointerId: number;
            startPointerX: number;
            startPointerY: number;
            startX: number;
            startY: number;
        } | null>(null);


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
    // IMAGE POINTER DOWN
    // ========================================================

    const handleImagePointerDown =
        (
            event: React.PointerEvent<HTMLImageElement>
        ) => {

            event.preventDefault();

            event.stopPropagation();


            const image =
                event.currentTarget;


            image.setPointerCapture(
                event.pointerId
            );


            dragRef.current = {

                pointerId:
                    event.pointerId,

                startPointerX:
                    event.clientX,

                startPointerY:
                    event.clientY,

                startX:
                    backgroundImage.x,

                startY:
                    backgroundImage.y,

            };

        };


    // ========================================================
    // IMAGE POINTER MOVE
    // ========================================================

    const handleImagePointerMove =
        (
            event: React.PointerEvent<HTMLImageElement>
        ) => {

            const drag =
                dragRef.current;


            if (!drag) {
                return;
            }


            if (
                event.pointerId !==
                drag.pointerId
            ) {
                return;
            }


            const deltaScreenX =
                event.clientX -
                drag.startPointerX;


            const deltaScreenY =
                event.clientY -
                drag.startPointerY;


            /*
             * Preview đang được scale.
             *
             * Vì vậy phải chuyển
             * pixel màn hình về
             * pixel design 640×360.
             */

            const deltaDesignX =
                deltaScreenX /
                scale;


            const deltaDesignY =
                deltaScreenY /
                scale;


            setBackgroundImagePosition(

                drag.startX +
                    deltaDesignX,

                drag.startY +
                    deltaDesignY

            );

        };


    // ========================================================
    // IMAGE POINTER UP
    // ========================================================

    const handleImagePointerUp =
        (
            event: React.PointerEvent<HTMLImageElement>
        ) => {

            const drag =
                dragRef.current;


            if (!drag) {
                return;
            }


            if (
                event.pointerId !==
                drag.pointerId
            ) {
                return;
            }


            try {

                event.currentTarget.releasePointerCapture(
                    event.pointerId
                );

            } catch {
                // Pointer capture có thể
                // đã được release trước đó.
            }


            dragRef.current =
                null;

        };


    // ========================================================
    // IMAGE POINTER CANCEL
    // ========================================================

    const handleImagePointerCancel =
        (
            event: React.PointerEvent<HTMLImageElement>
        ) => {

            const drag =
                dragRef.current;


            if (!drag) {
                return;
            }


            if (
                event.pointerId !==
                drag.pointerId
            ) {
                return;
            }


            dragRef.current =
                null;

        };


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
    // IMAGE STYLE
    // ========================================================

    const backgroundImageStyle =
        imageFile
            ? {
                left:
                    backgroundImage.x,

                top:
                    backgroundImage.y,

                transform:
                    `translate(-50%, -50%) scale(${backgroundImage.scale})`,
            }
            : undefined;


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
                        `scale(${scale})`,
                }}
            >

                {/* ==================================================
                    BACKGROUND IMAGE
                ================================================== */}

                {imageFile && (

                    <div
                        className="karaoke-background-layer"
                    >

                        <img
                            ref={imageRef}
                            src={imageFile}
                            alt=""
                            className="karaoke-background-image"
                            style={
                                backgroundImageStyle
                            }

                            draggable={false}

                            onPointerDown={
                                handleImagePointerDown
                            }

                            onPointerMove={
                                handleImagePointerMove
                            }

                            onPointerUp={
                                handleImagePointerUp
                            }

                            onPointerCancel={
                                handleImagePointerCancel
                            }
                        />

                    </div>

                )}


                {/* ==================================================
                    LYRICS
                ================================================== */}

                <div
                    className="karaoke-lyrics-layer"
                >

                    {currentLines.length === 0 && (

                        <div
                            className="waiting-text"
                        >
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