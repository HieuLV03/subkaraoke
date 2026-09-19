"use client";

import "./Preview.css";
import SubtitleWord from "./SubtitleWord";

import { useLyricsStore } from "@/stores/lyrics.store";

export default function SubtitleLine({
    line,
    currentTime,
    color,
    activeColor,
}: any) {


    // ========================================
    // STORE
    // ========================================

    const selectLine = useLyricsStore(
        (state) => state.selectLine
    );

    const moveLine = useLyricsStore(
        (state) => state.moveLine
    );

    const selectedLineId = useLyricsStore(
        (state) => state.selectedLineId
    );


    // ========================================
    // SAFETY
    // ========================================

    if (!line?.words) {

        return null;

    }


    // ========================================
    // STYLE
    // ========================================

    const style =
        line.style ?? {};


    // ========================================
    // POSITION
    // ========================================

    const x =
        style.x ?? 330;

    const y =
        style.y ?? 180;


    // ========================================
    // TEXT STYLE
    // ========================================

    const fontFamily =
        style.fontFamily ??
        "Arial";

    const fontSize =
        style.fontSize ??
        21;

    const textColor =
        style.color ??
        color ??
        "#ffffff";

    const highlightColor =
        style.activeColor ??
        activeColor ??
        "#00ff66";

    const outline =
        style.outline ??
        "#000000";

    const outlineWidth =
        style.outlineWidth ??
        2;

    const shadow =
        style.shadow ??
        true;

    const align =
        style.align ??
        "center";


    // ========================================
    // SELECTED
    // ========================================

    const isSelected =
        selectedLineId === line.id;


    // ========================================
    // DRAG
    // ========================================

    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {

        e.preventDefault();

        e.stopPropagation();


        selectLine(line.id);


        const startMouseX =
            e.clientX;

        const startMouseY =
            e.clientY;


        const startX =
            x;

        const startY =
            y;


        const handleMouseMove = (
            event: MouseEvent
        ) => {

            const deltaX =
                event.clientX -
                startMouseX;

            const deltaY =
                event.clientY -
                startMouseY;


            moveLine(

                line.id,

                startX + deltaX,

                startY + deltaY

            );

        };


        const handleMouseUp = () => {

            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            window.removeEventListener(
                "mouseup",
                handleMouseUp
            );

        };


        window.addEventListener(
            "mousemove",
            handleMouseMove
        );

        window.addEventListener(
            "mouseup",
            handleMouseUp
        );

    };


    // ========================================
    // RENDER
    // ========================================

    return (

      <div

    className={
        isSelected
            ? "subtitle-drag-box subtitle-drag-box-selected"
            : "subtitle-drag-box"
    }

    onMouseDown={
        handleMouseDown
    }

   style={{

    position: "absolute",

    left: `${x}px`,

    top: `${y}px`,

    transform: "translate(-50%, -50%)",

    display: "inline-block",

    cursor: "move",

    pointerEvents: "auto",

    userSelect: "none",

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
                        fontFamily,

                    fontSize:
                        `${fontSize}px`,

                    textAlign:
                        align,

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
                                textColor
                            }

                            activeColor={
                                highlightColor
                            }

                            fontFamily={
                                fontFamily
                            }

                            fontSize={
                                fontSize
                            }

                            outline={
                                outline
                            }

                            outlineWidth={
                                outlineWidth
                            }

                            shadow={
                                shadow
                            }

                        />

                    )
                )}

            </div>

        </div>

    );

}