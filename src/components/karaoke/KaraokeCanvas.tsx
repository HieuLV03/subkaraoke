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

    const playing =
        useEditorStore(
            (state) =>
                state.playing
        );

    const playbackRate =
        useEditorStore(
            (state) =>
                state.playbackRate
        );

    const backgroundMedia =
        useEditorStore(
            (state) =>
                state.backgroundMedia
        );

    const setBackgroundMediaPosition =
        useEditorStore(
            (state) =>
                state.setBackgroundMediaPosition
        );

    const imageFile =
        useProjectStore(
            (state) =>
                state.project?.imageFile
        );

    const videoFile =
        useProjectStore(
            (state) =>
                state.project?.videoFile
        );


    // ========================================================
    // REF
    // ========================================================

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const videoRef =
        useRef<HTMLVideoElement | null>(
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
    // CALCULATE PREVIEW SCALE
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
    // VIDEO CURRENT TIME SYNC
    // ========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        /*
         * Video background luôn bám
         * theo currentTime của Editor.
         *
         * Video chỉ được hiển thị khi
         * không có imageFile.
         */

        const difference =
            Math.abs(
                video.currentTime -
                currentTime
            );


        if (
            difference >
            0.05
        ) {

            try {

                video.currentTime =
                    currentTime;

            } catch {
                // Video chưa sẵn sàng.
            }

        }


        video.playbackRate =
            playbackRate;


        if (playing) {

            if (
                video.paused &&
                video.readyState >= 2
            ) {

                video.play().catch(
                    () => {}
                );

            }

        } else {

            if (!video.paused) {

                video.pause();

            }

        }

    }, [
        currentTime,
        playing,
        playbackRate,
        videoFile,
    ]);


    // ========================================================
    // VIDEO LOAD / RESET
    // ========================================================

    useEffect(() => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        const handleLoadedMetadata =
            () => {

                try {

                    video.currentTime =
                        currentTime;

                } catch {
                    // Ignore.
                }

            };


        video.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );


        return () => {

            video.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

        };

    }, [
        videoFile,
    ]);


    // ========================================================
    // MEDIA POINTER DOWN
    // ========================================================

    const handleMediaPointerDown =
        (
            event:
                React.PointerEvent<
                    HTMLImageElement |
                    HTMLVideoElement
                >
        ) => {

            event.preventDefault();

            event.stopPropagation();


            const media =
                event.currentTarget;


            media.setPointerCapture(
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
                    backgroundMedia.x,

                startY:
                    backgroundMedia.y,

            };

        };


    // ========================================================
    // MEDIA POINTER MOVE
    // ========================================================

    const handleMediaPointerMove =
        (
            event:
                React.PointerEvent<
                    HTMLImageElement |
                    HTMLVideoElement
                >
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
             * Preview được scale từ
             * 640×360 ra kích thước thật.
             *
             * Chuyển delta màn hình
             * về design coordinate.
             */

            const deltaDesignX =
                deltaScreenX /
                scale;


            const deltaDesignY =
                deltaScreenY /
                scale;


            setBackgroundMediaPosition(

                drag.startX +
                    deltaDesignX,

                drag.startY +
                    deltaDesignY

            );

        };


    // ========================================================
    // MEDIA POINTER UP
    // ========================================================

    const handleMediaPointerUp =
        (
            event:
                React.PointerEvent<
                    HTMLImageElement |
                    HTMLVideoElement
                >
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
                // Pointer capture đã được release.
            }


            dragRef.current =
                null;

        };


    // ========================================================
    // MEDIA POINTER CANCEL
    // ========================================================

    const handleMediaPointerCancel =
        (
            event:
                React.PointerEvent<
                    HTMLImageElement |
                    HTMLVideoElement
                >
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
    // BACKGROUND MEDIA STYLE
    // ========================================================

    const backgroundMediaStyle =
        {
            left:
                backgroundMedia.x,

            top:
                backgroundMedia.y,

            transform:
                `translate(-50%, -50%) scale(${backgroundMedia.scale})`,
        };


    // ========================================================
    // WHICH MEDIA IS BACKGROUND?
    // ========================================================

    /*
     * Nếu có imageFile:
     *
     *     image = background
     *     video = timing/master clock
     *
     * Nếu không có imageFile nhưng có videoFile:
     *
     *     video = background
     */

    const showImageBackground =
        Boolean(imageFile);


    const showVideoBackground =
        !imageFile &&
        Boolean(videoFile);


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
                    BACKGROUND MEDIA
                ================================================== */}

                <div
                    className="karaoke-background-layer"
                >

                    {/* ==================================================
                        IMAGE BACKGROUND
                    ================================================== */}

                    {showImageBackground && (

                 <img
    src={imageFile ?? undefined}
                            alt=""
                            className="karaoke-background-image"

                            style={
                                backgroundMediaStyle
                            }

                            draggable={false}

                            onPointerDown={
                                handleMediaPointerDown
                            }

                            onPointerMove={
                                handleMediaPointerMove
                            }

                            onPointerUp={
                                handleMediaPointerUp
                            }

                            onPointerCancel={
                                handleMediaPointerCancel
                            }
                        />

                    )}


                    {/* ==================================================
                        VIDEO BACKGROUND
                    ================================================== */}

                    {showVideoBackground && (

                <video
    ref={videoRef}
    src={videoFile ?? undefined}
                            className="karaoke-background-video"

                            style={
                                backgroundMediaStyle
                            }

                            muted

                            playsInline

                            preload="auto"

                            onPointerDown={
                                handleMediaPointerDown
                            }

                            onPointerMove={
                                handleMediaPointerMove
                            }

                            onPointerUp={
                                handleMediaPointerUp
                            }

                            onPointerCancel={
                                handleMediaPointerCancel
                            }
                        />

                    )}

                </div>


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