
"use client";

import "./Preview.css";


// ============================================================
// PROPS
// ============================================================

type Props = {
    word: any;
    currentTime: number;

    color: string;
    activeColor: string;

    fontFamily?: string;
    fontSize?: number;

    outline?: string;
    outlineWidth?: number;

    shadow?: boolean;

    // Position calculated by KaraokeLayout
    x?: number;
    width?: number;
    scale?: number;
};


// ============================================================
// COMPONENT
// ============================================================

export default function SubtitleWord({

    word,
    currentTime,

    color,
    activeColor,

    fontFamily = "Arial",
    fontSize = 30,

    outline = "#000000",
    outlineWidth = 2,

    shadow = true,

    x = 0,
    width = 0,
    scale = 1,

}: Props) {


    // ========================================================
    // KARAOKE PERCENT
    // ========================================================

    let percent = 0;


    if (
        word.start != null &&
        word.end != null &&
        word.end > word.start
    ) {

        if (
            currentTime >= word.end
        ) {

            percent = 100;

        }

        else if (
            currentTime >= word.start
        ) {

            percent =
                (
                    (
                        currentTime -
                        word.start
                    ) /
                    (
                        word.end -
                        word.start
                    )
                ) *
                100;

        }

    }


    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


    // ========================================================
    // TEXT
    // ========================================================

    const text =
        word.word ??
        word.text ??
        "";


    // ========================================================
    // SCALED STYLE
    //
    // KaraokeLayout already calculates the word width
    // using fontSize * scale.
    //
    // Preview must therefore use the same scale.
    // ========================================================

    const actualFontSize =
        fontSize *
        scale;


    const actualOutlineWidth =
        outlineWidth *
        scale;


    // ========================================================
    // TEXT STYLE
    // ========================================================

    const textStyle:
        React.CSSProperties = {

        position:
            "absolute",

        left:
            `${x}px`,

        top:
            "50%",

        transform:
            "translateY(-50%)",

        width:
            `${width}px`,

        height:
            `${actualFontSize}px`,

        fontFamily:
            fontFamily,

        fontSize:
            `${actualFontSize}px`,

        fontWeight:
            400,

        lineHeight:
            "normal",

        whiteSpace:
            "nowrap",

        WebkitTextStroke:
            `${actualOutlineWidth}px ${outline}`,

        paintOrder:
            "stroke fill",

        textShadow:
            shadow
                ? "0 2px 4px rgba(0,0,0,0.6)"
                : "none",

        pointerEvents:
            "none",

    };


    // ========================================================
    // FILL STYLE
    // ========================================================

    const fillStyle:
        React.CSSProperties = {

        position:
            "absolute",

        left:
            0,

        top:
            0,

        width:
            `${percent}%`,

        height:
            "100%",

        overflow:
            "hidden",

        whiteSpace:
            "nowrap",

        color:
            activeColor,

        pointerEvents:
            "none",

    };


    // ========================================================
    // NORMAL TEXT STYLE
    // ========================================================

    const normalStyle:
        React.CSSProperties = {

        color:
            color,

        whiteSpace:
            "nowrap",

    };


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <span

            className="subtitle-word"

            style={
                textStyle
            }

        >

            {/* ================================================
                NORMAL TEXT
            ================================================ */}

            <span

                className="subtitle-normal"

                style={
                    normalStyle
                }

            >

                {text}

            </span>


            {/* ================================================
                KARAOKE ACTIVE FILL
            ================================================ */}

            {percent > 0 && (

                <span

                    className="subtitle-fill"

                    style={
                        fillStyle
                    }

                >

                    {text}

                </span>

            )}

        </span>

    );

}
