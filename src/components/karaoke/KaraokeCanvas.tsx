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

const MAX_MEDIA_SCALE = 5;

// ============================================================
// HELPER
// ============================================================

/*

* Tính scale tối thiểu để media LUÔN phủ kín 640×360.
*
* Ví dụ:
*
* Ảnh 1920×1080
* -> fitScale = 0.3333
*
* Ảnh 1080×1920
* -> fitScale = 0.5925
*
* Sau khi đã đưa ảnh về kích thước fit,
* editor scale bắt đầu từ 1.
  */

const getCoverScale = (
width: number,
height: number
) => {


if (
    width <= 0 ||
    height <= 0
) {
    return 1;
}

return Math.max(
    DESIGN_WIDTH / width,
    DESIGN_HEIGHT / height
);


};

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
// MEDIA SIZE
// ========================================================

/*
 * Đây là kích thước media SAU KHI
 * fit cover vào canvas.
 *
 * Ví dụ ảnh 1920×1080:
 *
 * baseWidth  = 640
 * baseHeight = 360
 *
 * Ảnh 1080×1920:
 *
 * baseWidth  = 640
 * baseHeight = 1137.78
 */

const [
    mediaSize,
    setMediaSize
] = useState<{
    width: number;
    height: number;
}>({
    width: 0,
    height: 0,
});


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
// IMAGE METADATA
// ========================================================

const handleImageLoad =
    (
        event:
            React.SyntheticEvent<
                HTMLImageElement
            >
    ) => {

        const image =
            event.currentTarget;


        if (
            image.naturalWidth <= 0 ||
            image.naturalHeight <= 0
        ) {
            return;
        }


        const coverScale =
            getCoverScale(
                image.naturalWidth,
                image.naturalHeight
            );


        setMediaSize({

            width:
                image.naturalWidth *
                coverScale,

            height:
                image.naturalHeight *
                coverScale,

        });

    };


// ========================================================
// VIDEO METADATA
// ========================================================

const handleVideoLoadedMetadata =
    () => {

        const video =
            videoRef.current;

        if (!video) {
            return;
        }


        if (
            video.videoWidth <= 0 ||
            video.videoHeight <= 0
        ) {
            return;
        }


        const coverScale =
            getCoverScale(
                video.videoWidth,
                video.videoHeight
            );


        setMediaSize({

            width:
                video.videoWidth *
                coverScale,

            height:
                video.videoHeight *
                coverScale,

        });

    };


// ========================================================
// VIDEO SYNC
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
// VIDEO METADATA / SYNC
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

            handleVideoLoadedMetadata();


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
// RESET MEDIA SIZE WHEN MEDIA CHANGES
// ========================================================

useEffect(() => {

    setMediaSize({
        width: 0,
        height: 0,
    });

}, [
    imageFile,
    videoFile,
]);


// ========================================================
// CLAMP POSITION
// ========================================================

const clampMediaPosition =
    (
        x: number,
        y: number,
        scale: number
    ) => {

        if (
            mediaSize.width <= 0 ||
            mediaSize.height <= 0
        ) {

            return {
                x: DESIGN_WIDTH / 2,
                y: DESIGN_HEIGHT / 2,
            };

        }


        /*
         * Kích thước media hiện tại
         * sau zoom.
         */

        const scaledWidth =
            mediaSize.width *
            scale;

        const scaledHeight =
            mediaSize.height *
            scale;


        const halfWidth =
            scaledWidth / 2;

        const halfHeight =
            scaledHeight / 2;


        /*
         * Media phải luôn phủ kín
         * canvas.
         *
         * LEFT:
         *
         * centerX không được lớn hơn
         * halfWidth.
         *
         * RIGHT:
         *
         * centerX không được nhỏ hơn
         *
         * DESIGN_WIDTH - halfWidth
         */

        const minX =
            DESIGN_WIDTH -
            halfWidth;

        const maxX =
            halfWidth;


        const minY =
            DESIGN_HEIGHT -
            halfHeight;

        const maxY =
            halfHeight;


        return {

            x:
                Math.min(
                    maxX,
                    Math.max(
                        minX,
                        x
                    )
                ),

            y:
                Math.min(
                    maxY,
                    Math.max(
                        minY,
                        y
                    )
                ),

        };

    };


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


        const deltaDesignX =
            deltaScreenX /
            previewScale;


        const deltaDesignY =
            deltaScreenY /
            previewScale;


        const rawX =
            drag.startX +
            deltaDesignX;


        const rawY =
            drag.startY +
            deltaDesignY;


        /*
         * QUAN TRỌNG:
         *
         * Không cho ảnh chạy ra ngoài
         * canvas.
         */

        const position =
            clampMediaPosition(
                rawX,
                rawY,
                backgroundMedia.scale
            );


        setBackgroundMediaPosition(
            position.x,
            position.y
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


        const zoomFactor =
            event.deltaY < 0
                ? 1.1
                : 0.9;


        /*
         * Không dùng MIN_MEDIA_SCALE
         * cố định nữa.
         *
         * Vì mediaSize đã là kích thước
         * vừa đủ cover 640×360,
         * nên scale nhỏ nhất = 1.
         */

        const nextScale =
            Math.min(
                MAX_MEDIA_SCALE,
                Math.max(
                    1,
                    backgroundMedia.scale *
                        zoomFactor
                )
            );


        /*
         * Khi zoom out,
         * position hiện tại có thể
         * trở thành không hợp lệ.
         *
         * Vì vậy phải clamp lại x/y.
         */

        const position =
            clampMediaPosition(
                backgroundMedia.x,
                backgroundMedia.y,
                nextScale
            );


        setBackgroundMediaScale(
            nextScale
        );


        setBackgroundMediaPosition(
            position.x,
            position.y
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

    width:
        mediaSize.width > 0
            ? mediaSize.width
            : undefined,

    height:
        mediaSize.height > 0
            ? mediaSize.height
            : undefined,

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

                        onLoad={
                            handleImageLoad
                        }

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

                        onLoadedMetadata={
                            handleVideoLoadedMetadata
                        }

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