
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
// EXPORT SCALE
// ============================================================

export const EXPORT_SCALE =
    EXPORT_WIDTH / PREVIEW_WIDTH;


// ============================================================
// WORD GAP
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
// FONT WEIGHT
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
//
// Layout luôn được tính ở Preview coordinate.
// ============================================================

export function getCanvasFont(
    style: Required<LyricStyle>
): string {

    const fontSize =
        style.fontSize *
        style.scale;

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
// QUAN TRỌNG:
//
// Hàm này LUÔN tính layout ở hệ tọa độ Preview 640x360.
//
// Preview:
//     x = 330
//     y = 180
//
// Export:
//     x = 330 * 3
//     y = 180 * 3
//
// Không truyền coordinateScale vào đây nữa.
// ============================================================

export function calculateLyricLayout(
    line: LyricLine,
    ctx: CanvasRenderingContext2D
): LayoutLine {

    const style =
        getLyricStyle(line);

    const words =
        line.words ?? [];


    // --------------------------------------------------------
    // FONT
    //
    // Font đã bao gồm style.scale.
    // --------------------------------------------------------

    ctx.font =
        getCanvasFont(style);


    // --------------------------------------------------------
    // WORD LAYOUT
    // --------------------------------------------------------

    const wordLayouts: LayoutWord[] = [];

    let totalWidth = 0;

    const gap =
        getWordGap(style);


    for (
        let i = 0;
        i < words.length;
        i++
    ) {

        const word =
            words[i];

        const text =
            getWordText(word);


        // ----------------------------------------------------
        // ĐO WIDTH
        // ----------------------------------------------------

        const width =
            ctx.measureText(text).width;


        wordLayouts.push({

            word,

            text,

            width,

            x: 0,

        });


        totalWidth += width;


        // ----------------------------------------------------
        // GAP
        // ----------------------------------------------------

        if (
            i <
            words.length - 1
        ) {

            totalWidth += gap;

        }

    }


    // --------------------------------------------------------
    // CENTER
    // --------------------------------------------------------

    const centerX =
        style.x;

    const centerY =
        style.y;


    // --------------------------------------------------------
    // START X
    // --------------------------------------------------------

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
                gap;

        }

    }


    // --------------------------------------------------------
    // LINE HEIGHT
    // --------------------------------------------------------

    const height =
        style.fontSize *
        style.scale;


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
