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
// ZOOM
// ============================================================

const MIN_MEDIA_SCALE = 0.5;
const MAX_MEDIA_SCALE = 5;


// ============================================================
// COMPONENT
// ============================================================

export default function KaraokeCanvas() {

    // ========================================================
    // LYRICS
    // ========================================================

    const lyrics =
        useLyricsStore(
            (state) =>
                state.lyrics
        );


    // ========================================================
    // EDITOR
    // ========================================================

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

    const setBackgroundMediaScale =
        useEditorStore(
            (state) =>
                state.setBackgroundMediaScale
        );


    // ========================================================
    // PROJECT
    // ========================================================

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
    // REFS
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
    // PREVIEW SCALE
    // ========================================================

    const [
        previewScale,
        setPreviewScale
    ] = useState(1);


    // ========================================================
    // DRAG
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
    // WHICH MEDIA IS BACKGROUND?
    // ========================================================

    /*
     * Có image:
     *
     *     image = background
     *     video = timing only
     *
     * Không có image:
     *
     *     video = background + timing
     */

    const showImageBackground =
        Boolean(imageFile);

    const showVideoBackground =
        !imageFile &&
        Boolean(videoFile);


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


                setPreviewScale(
                    Math.min(
                        scaleX,
                        scaleY
                    )
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
    // VIDEO SYNC
    // ========================================================

    useEffect(() => {

        /*
         * Chỉ sync video khi VIDEO
         * thực sự là background.
         *
         * Nếu đang dùng image:
         *
         *     video không được render
         *     trong canvas.
         */

        if (
            !showVideoBackground
        ) {
            return;
        }


        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        const difference =
            Math.abs(
                video.currentTime -
                currentTime
            );


        if (
            difference > 0.05 &&
            video.readyState >= 2
        ) {

            try {

                video.currentTime =
                    currentTime;

            } catch {
                // Ignore.
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
        showVideoBackground,
    ]);


    // ========================================================
    // VIDEO METADATA
    // ========================================================

    useEffect(() => {

        if (
            !showVideoBackground
        ) {
            return;
        }


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
        showVideoBackground,
        currentTime,
    ]);


    // ========================================================
    // POINTER DOWN
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
    // POINTER MOVE
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
             * UI preview đang scale từ
             * 640×360 lên kích thước thật.
             *
             * Vì vậy phải đưa delta
             * về design coordinate.
             */

            const deltaDesignX =
                deltaScreenX /
                previewScale;


            const deltaDesignY =
                deltaScreenY /
                previewScale;


            setBackgroundMediaPosition(

                drag.startX +
                    deltaDesignX,

                drag.startY +
                    deltaDesignY

            );

        };


    // ========================================================
    // POINTER UP
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
                // Ignore.
            }


            dragRef.current =
                null;

        };


    // ========================================================
    // POINTER CANCEL
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
    // WHEEL ZOOM
    // ========================================================

    const handleMediaWheel =
        (
            event:
                React.WheelEvent<
                    HTMLImageElement |
                    HTMLVideoElement
                >
        ) => {

            event.preventDefault();
            event.stopPropagation();


            /*
             * deltaY âm:
             *
             *     zoom in
             *
             * deltaY dương:
             *
             *     zoom out
             */

            const zoomFactor =
                event.deltaY < 0
                    ? 1.1
                    : 0.9;


            const nextScale =
                Math.min(
                    MAX_MEDIA_SCALE,
                    Math.max(
                        MIN_MEDIA_SCALE,
                        backgroundMedia.scale *
                            zoomFactor
                    )
                );


            setBackgroundMediaScale(
                nextScale
            );

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
    // BACKGROUND STYLE
    // ========================================================

    const backgroundMediaStyle:
        React.CSSProperties = {

        left:
            backgroundMedia.x,

        top:
            backgroundMedia.y,

        transform:
            `translate(-50%, -50%) scale(${backgroundMedia.scale})`,
    };


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
                        `scale(${previewScale})`,
                }}
            >

                {/* ==================================================
                    BACKGROUND MEDIA

                    CHỈ MỘT MEDIA ĐƯỢC HIỂN THỊ.

                    IMAGE:
                        image background
                        video chỉ timing ở nơi khác

                    VIDEO:
                        video background + timing
                ================================================== */}

                <div
                    className="karaoke-background-layer"
                >

                    {showImageBackground && (

                        <img
                            src={
                                imageFile ??
                                undefined
                            }

                            alt=""

                            className={
                                "karaoke-background-media"
                            }

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

                            onWheel={
                                handleMediaWheel
                            }
                        />

                    )}


                    {showVideoBackground && (

                        <video
                            ref={videoRef}

                            src={
                                videoFile ??
                                undefined
                            }

                            className={
                                "karaoke-background-media"
                            }

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

                            onWheel={
                                handleMediaWheel
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