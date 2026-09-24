
"use client";

import "./Preview.css";

import SubtitleWord from "./SubtitleWord";

import { useLyricsStore } from "@/stores/lyrics.store";

import {
    PREVIEW_WIDTH,
    calculateLyricLayout,
    getLyricStyle,
} from "../../karaoke/KaraokeLayout";


// ============================================================
// COMPONENT
// ============================================================

export default function SubtitleLine({

    line,
    currentTime,
    color,
    activeColor,

}: any) {


    // ========================================================
    // STORE
    // ========================================================

    const selectLine =
        useLyricsStore(
            (state) =>
                state.selectLine
        );


    const moveLine =
        useLyricsStore(
            (state) =>
                state.moveLine
        );


    const selectedLineId =
        useLyricsStore(
            (state) =>
                state.selectedLineId
        );


    // ========================================================
    // SAFETY
    // ========================================================

    if (
        !line?.words?.length
    ) {

        return null;

    }


    // ========================================================
    // STYLE
    // ========================================================

    const style =
        getLyricStyle(line);


    // ========================================================
    // POSITION
    //
    // x / y là tâm của line
    // trong hệ tọa độ 640x360.
    // ========================================================

const measureCanvas =
    document.createElement("canvas");

const measureCtx =
    measureCanvas.getContext("2d");

if (!measureCtx) {
    return null;
}

const layout =
    calculateLyricLayout(
        line,
        measureCtx
    );

const x = layout.x;
const y = layout.y;

    // ========================================================
    // SELECTED
    // ========================================================

    const isSelected =
        selectedLineId ===
        line.id;


    // ========================================================
    // DRAG
    //
    // Mouse movement là pixel màn hình.
    //
    // Phải đổi về coordinate 640x360.
    // ========================================================

    const handlePointerDown = (

        e: React.PointerEvent<HTMLDivElement>

    ) => {

        e.preventDefault();

        e.stopPropagation();


        selectLine(
            line.id
        );


        try {

            e.currentTarget
                .setPointerCapture(
                    e.pointerId
                );

        }
        catch {

            // Ignore

        }


        const startPointerX =
            e.clientX;

        const startPointerY =
            e.clientY;


        const startX =
            x;

        const startY =
            y;


        // ====================================================
        // FIND PREVIEW CONTAINER
        // ====================================================

        const target =
            e.currentTarget.closest(
                ".karaoke-canvas"
            ) as HTMLElement | null;


        const rect =
            target?.getBoundingClientRect();


        const previewScaleX =
            rect
                ? rect.width /
                  PREVIEW_WIDTH
                : 1;


        const previewScaleY =
            rect
                ? rect.height /
                  360
                : 1;


        const handlePointerMove = (

            event: PointerEvent

        ) => {

            // ------------------------------------------------
            // SCREEN → PREVIEW
            // ------------------------------------------------

            const deltaX =
                (
                    event.clientX -
                    startPointerX
                ) /
                previewScaleX;


            const deltaY =
                (
                    event.clientY -
                    startPointerY
                ) /
                previewScaleY;


            // ------------------------------------------------
            // MOVE
            // ------------------------------------------------

            moveLine(

                line.id,

                startX +
                    deltaX,

                startY +
                    deltaY

            );

        };


        const handlePointerUp = () => {

            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );

            window.removeEventListener(
                "pointercancel",
                handlePointerUp
            );

        };


        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        window.addEventListener(
            "pointercancel",
            handlePointerUp
        );

    };


    // ========================================================
    // SHARED LAYOUT
    //
    // Preview cũng dùng chính layout
    // mà Export sử dụng.
    //
    // Canvas chỉ dùng để measure text.
    // ========================================================

    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div

            className={
                isSelected
                    ? "subtitle-drag-box subtitle-drag-box-selected"
                    : "subtitle-drag-box"
            }

            onPointerDown={
                handlePointerDown
            }

            style={{

                position:
                    "absolute",

                left:
                    `${x}px`,

                top:
                    `${y}px`,

                width:
                    `${layout.width}px`,

                height:
                    `${layout.height}px`,


                cursor:
                    "move",

                pointerEvents:
                    "auto",

                userSelect:
                    "none",

                touchAction:
                    "none",

                zIndex:
                    isSelected
                        ? 100
                        : 10,

            }}

        >

            <div

                className="subtitle-line"

                style={{

                    position:
                        "relative",

                    width:
                        `${layout.width}px`,

                    height:
                        `${layout.height}px`,

                    fontFamily:
                        style.fontFamily,

                    fontSize:
                        `${style.fontSize * style.scale}px`,

                    fontWeight:
                        400,

                    textAlign:
                        "left",

                }}

            >

                {layout.words.map(

                    (
                        layoutWord,
                        index
                    ) => {

                        const word =
                            layoutWord.word;


                        return (

                            <SubtitleWord

                                key={
                                    word.id ??
                                    `${line.id}-word-${index}`
                                }

                                word={
                                    word
                                }

                                currentTime={
                                    currentTime
                                }

                                color={
                                    style.color ??
                                    color ??
                                    "#ffffff"
                                }

                                activeColor={
                                    style.activeColor ??
                                    activeColor ??
                                    "#00ff66"
                                }

                                fontFamily={
                                    style.fontFamily
                                }

                                fontSize={
                                    style.fontSize
                                }

                                outline={
                                    style.outline
                                }

                                outlineWidth={
                                    style.outlineWidth
                                }

                                shadow={
                                    style.shadow
                                }

                                x={
                                    layoutWord.x -
                                    layout.startX
                                }

                                width={
                                    layoutWord.width
                                }

                                scale={
                                    style.scale
                                }

                            />

                        );

                    }

                )}

            </div>

        </div>

    );

}
