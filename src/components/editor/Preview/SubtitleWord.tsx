"use client";

import "./Preview.css";

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
};

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

}: Props) {


    // ========================================
    // KARAOKE PERCENT
    // ========================================

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
                    (currentTime - word.start) /
                    (word.end - word.start)
                ) * 100;

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


    // ========================================
    // TEXT
    // ========================================

    const text =
        word.word ??
        word.text ??
        "";


    // ========================================
    // TEXT STYLE
    // ========================================

    const textStyle: React.CSSProperties = {

        fontFamily:

            fontFamily,

        fontSize:

            `${fontSize}px`,

        WebkitTextStroke:

            `${outlineWidth}px ${outline}`,

        paintOrder:

            "stroke fill",

        textShadow:

            shadow
                ? `0 2px 4px rgba(0,0,0,0.6)`
                : "none",

    };


    // ========================================
    // RENDER
    // ========================================

    return (

        <span
            className="subtitle-word"
            style={textStyle}
        >


            {/* =================================
                NORMAL TEXT
            ================================= */}

            <span

                className="subtitle-normal"

                style={{

                    color:

                        color,

                }}

            >

                {text}&nbsp;

            </span>


            {/* =================================
                KARAOKE FILL
            ================================= */}

            <span

                className="subtitle-fill"

                style={{

                    width:
                        `${percent}%`,

                    color:
                        activeColor,

                }}

            >

                {text}&nbsp;

            </span>


        </span>

    );

}