"use client";

import "./Preview.css";

import SubtitleWord from "./SubtitleWord";

import { useLyricsStore } from "@/stores/lyrics.store";

import {
    getLyricStyle,
} from "../../karaoke/KaraokeLayout";


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
        !line?.words
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
    // ========================================================

    const x =
        style.x;

    const y =
        style.y;


    // ========================================================
    // SELECTED
    // ========================================================

    const isSelected =
        selectedLineId ===
        line.id;


    // ========================================================
    // DRAG
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


        const handlePointerMove = (

            event: PointerEvent

        ) => {

            const deltaX =
                event.clientX -
                startPointerX;


            const deltaY =
                event.clientY -
                startPointerY;


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

                transform:
                    "translate(-50%, -50%)",

                display:
                    "inline-block",

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

                    fontFamily:
                        style.fontFamily,

                    fontSize:
                        `${style.fontSize}px`,

                    fontWeight:
                        400,

                    textAlign:
                        style.align,

                }}

            >

                {line.words.map(

                    (word: any) => (

                        <SubtitleWord

                            key={
                                word.id
                            }

                            word={
                                word
                            }

                            currentTime={
                                currentTime
                            }

                            color={
                                style.color ??
                                color
                            }

                            activeColor={
                                style.activeColor ??
                                activeColor
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

                        />

                    )

                )}

            </div>

        </div>

    );

}