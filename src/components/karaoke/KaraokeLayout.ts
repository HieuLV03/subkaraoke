// src/karaoke/KaraokeLayout.ts

// ============================================================
// TYPES
// ============================================================

export type LyricWord = {
    id?: string;
    word?: string;
    text?: string;

    start?: number;
    end?: number;

    synced?: boolean;
    measuredWidth?: number;
};

export type LyricStyle = {
    fontFamily?: string;
    fontSize?: number;

    color?: string;
    activeColor?: string;

    outline?: string;
    outlineWidth?: number;

    shadow?: boolean;

    x?: number;
    y?: number;

    scale?: number;

    align?: "left" | "center" | "right";
};

export type LyricLine = {
    id?: string;

    start?: number;
    end?: number;

    text?: string;

    words?: LyricWord[];

    style?: LyricStyle;
};


// ============================================================
// PREVIEW SIZE
// ============================================================

export const PREVIEW_WIDTH = 640;
export const PREVIEW_HEIGHT = 360;


// ============================================================
// EXPORT SIZE
// ============================================================

export const EXPORT_WIDTH = 1920;
export const EXPORT_HEIGHT = 1080;


// ============================================================
// SCALE
// ============================================================

export const EXPORT_SCALE =
    EXPORT_WIDTH / PREVIEW_WIDTH;


// ============================================================
// WORD GAP
//
// Đây là khoảng cách giữa các word.
//
// Quan trọng:
// Preview và Export đều dùng giá trị này.
// ============================================================

export const WORD_GAP = 12;


// ============================================================
// DEFAULT STYLE
// ============================================================

export function getDefaultLyricStyle(): Required<LyricStyle> {

    return {

        fontFamily: "Arial",

        fontSize: 21,

        color: "#ffffff",

        activeColor: "#00ff66",

        outline: "#000000",

        outlineWidth: 2,

        shadow: true,

        x: 330,

        y: 180,

        scale: 1,

        align: "center",

    };

}


// ============================================================
// GET STYLE
// ============================================================

export function getLyricStyle(
    line: LyricLine
): Required<LyricStyle> {

    return {

        ...getDefaultLyricStyle(),

        ...(line.style ?? {}),

    };

}


// ============================================================
// GET WORD TEXT
// ============================================================

export function getWordText(
    word: LyricWord
): string {

    return String(
        word.word ??
        word.text ??
        ""
    );

}


// ============================================================
// FONT
//
// Preview SubtitleWord hiện không set font-weight,
// nên layout chung dùng 400.
//
// Nếu sau này Preview đổi sang bold,
// chỉ cần đổi một chỗ này.
// ============================================================

export function getFontWeight(): number {

    return 400;

}


// ============================================================
// CSS FONT
// ============================================================

export function getCSSFont(
    style: Required<LyricStyle>
): string {

    return `${getFontWeight()} ${style.fontSize}px "${style.fontFamily}"`;

}


// ============================================================
// CANVAS FONT
// ============================================================

export function getCanvasFont(
    style: Required<LyricStyle>,
    scale = 1
): string {

    const fontSize =
        style.fontSize *
        scale;

    return `${getFontWeight()} ${fontSize}px "${style.fontFamily}"`;

}


// ============================================================
// MEASURE WORD
// ============================================================

export function measureWord(
    ctx: CanvasRenderingContext2D,
    word: LyricWord,
    style: Required<LyricStyle>
): number {

    const text =
        getWordText(word);

    ctx.font =
        getCanvasFont(style);

    return ctx.measureText(text).width;

}


// ============================================================
// WORD GAP
// ============================================================

export function getWordGap(
    style: Required<LyricStyle>
): number {

    return WORD_GAP * style.scale;

}


// ============================================================
// LAYOUT WORD
// ============================================================

export type LayoutWord = {

    word: LyricWord;

    text: string;

    width: number;

    x: number;

    percent?: number;

};


// ============================================================
// LAYOUT LINE
// ============================================================

export type LayoutLine = {

    line: LyricLine;

    style: Required<LyricStyle>;

    x: number;

    y: number;

    width: number;

    height: number;

    startX: number;

    words: LayoutWord[];

};


// ============================================================
// CALCULATE LINE LAYOUT
//
// Đây là hàm QUAN TRỌNG NHẤT.
//
// Preview và Export đều phải dùng logic này.
// ============================================================

export function calculateLyricLayout(
    line: LyricLine,
    ctx: CanvasRenderingContext2D,
    coordinateScale = 1
): LayoutLine {

    const style =
        getLyricStyle(line);


    const words =
        line.words ?? [];


    // --------------------------------------------------------
    // FONT SCALE
    // --------------------------------------------------------

    const fontScale =
        coordinateScale;


    // --------------------------------------------------------
    // FONT
    // --------------------------------------------------------

    ctx.font =
        getCanvasFont(
            style,
            fontScale
        );


    // --------------------------------------------------------
    // WORD WIDTH
    // --------------------------------------------------------

    const wordLayouts: LayoutWord[] = [];

    let totalWidth = 0;


    for (
        let i = 0;
        i < words.length;
        i++
    ) {

        const word =
            words[i];

        const text =
            getWordText(word);


        const measuredWidth =
            ctx.measureText(
                text
            ).width;


        const width =
            measuredWidth *
            style.scale;


        wordLayouts.push({

            word,

            text,

            width,

            x: 0,

        });


        totalWidth += width;


        if (
            i <
            words.length - 1
        ) {

            totalWidth +=
                WORD_GAP *
                style.scale *
                coordinateScale;

        }

    }


    // --------------------------------------------------------
    // POSITION
    //
    // style.x / style.y luôn là tâm của line.
    // --------------------------------------------------------

    const centerX =
        style.x *
        coordinateScale;

    const centerY =
        style.y *
        coordinateScale;


    let startX =
        centerX;


    if (
        style.align ===
        "center"
    ) {

        startX =
            centerX -
            totalWidth / 2;

    }
    else if (
        style.align ===
        "right"
    ) {

        startX =
            centerX -
            totalWidth;

    }


    // --------------------------------------------------------
    // APPLY WORD X
    // --------------------------------------------------------

    let currentX =
        startX;


    for (
        let i = 0;
        i < wordLayouts.length;
        i++
    ) {

        const layout =
            wordLayouts[i];


        layout.x =
            currentX;


        currentX +=
            layout.width;


        if (
            i <
            wordLayouts.length - 1
        ) {

            currentX +=
                WORD_GAP *
                style.scale *
                coordinateScale;

        }

    }


    // --------------------------------------------------------
    // LINE HEIGHT
    // --------------------------------------------------------

    const height =
        style.fontSize *
        style.scale *
        coordinateScale;


    // --------------------------------------------------------
    // RESULT
    // --------------------------------------------------------

    return {

        line,

        style,

        x: centerX,

        y: centerY,

        width: totalWidth,

        height,

        startX,

        words:
            wordLayouts,

    };

}