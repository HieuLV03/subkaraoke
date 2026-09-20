
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

    const handlePointerDown = (
        e: React.PointerEvent<HTMLDivElement>
    ) => {

        e.preventDefault();

        e.stopPropagation();


        // Chọn line
        selectLine(line.id);


        // Giữ pointer hiện tại
        // để tiếp tục nhận move trên mobile
        try {

            e.currentTarget.setPointerCapture(
                e.pointerId
            );

        } catch {
            // Một số browser có thể không hỗ trợ
        }


        // Vị trí pointer lúc bắt đầu kéo
        const startPointerX =
            e.clientX;

        const startPointerY =
            e.clientY;


        // Vị trí line lúc bắt đầu kéo
        const startX =
            x;

        const startY =
            y;


        // ========================================
        // POINTER MOVE
        // ========================================

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

                startX + deltaX,

                startY + deltaY

            );

        };


        // ========================================
        // POINTER UP
        // ========================================

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


        // ========================================
        // EVENTS
        // ========================================

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

            onPointerDown={
                handlePointerDown
            }

            style={{

                position: "absolute",

                left: `${x}px`,

                top: `${y}px`,

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

                // Quan trọng cho mobile:
                // không để browser hiểu thao tác
                // này là scroll/gesture
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
