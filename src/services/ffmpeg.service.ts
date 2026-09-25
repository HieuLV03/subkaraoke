import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

import { useEditorStore } from "../stores/editor.store";

import {
EXPORT_WIDTH,
EXPORT_HEIGHT,
EXPORT_SCALE,
calculateLyricLayout,
getLyricStyle,
getWordText,
getFontWeight,
} from "../components/karaoke/KaraokeLayout";

// ============================================================
// CONFIG
// ============================================================

const EXPORT_FPS = 20;

const FFMPEG_CORE_VERSION = "0.12.10";

// ============================================================
// DESIGN SIZE
//
// Preview:
// 640 × 360
//
// Export:
// 1920 × 1080
//
// EXPORT_SCALE = 3
// ============================================================

const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 360;

// ============================================================
// TYPES
// ============================================================

type LyricWord = {
id?: string;


word?: string;

text?: string;

start?: number;

end?: number;

synced?: boolean;

measuredWidth?: number;


};

type LyricStyle = {
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

align?:
    | "left"
    | "center"
    | "right";


};

type LyricLine = {
id?: string;


start?: number;

end?: number;

text?: string;

words?: LyricWord[];

style?: LyricStyle;


};

// ============================================================
// FFMPEG SINGLETON
// ============================================================

let ffmpeg: FFmpeg | null = null;

let ffmpegLoaded = false;

// ============================================================
// LOAD FFMPEG
// ============================================================

async function loadFFmpeg(): Promise<FFmpeg> {


if (
    ffmpeg &&
    ffmpegLoaded
) {
    return ffmpeg;
}


console.log(
    "[FFMPEG] Loading..."
);


const instance =
    new FFmpeg();


instance.on(
    "log",
    ({ message }) => {

        console.log(
            "[FFMPEG]",
            message
        );

    }
);


instance.on(
    "progress",
    ({ progress }) => {

        console.log(
            "[FFMPEG PROGRESS]",
            Math.round(
                progress * 100
            ),
            "%"
        );

    }
);


const baseURL =
    `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;


const coreURL =
    await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
    );


const wasmURL =
    await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
    );


await instance.load({
    coreURL,
    wasmURL,
});


ffmpeg =
    instance;

ffmpegLoaded =
    true;


console.log(
    "[FFMPEG] Loaded."
);


return instance;


}

// ============================================================
// HELPERS
// ============================================================

function clamp(
value: number,
min: number,
max: number
): number {


return Math.max(
    min,
    Math.min(
        max,
        value
    )
);


}

// ============================================================
// GET MEDIA DIMENSIONS
//
// Lấy kích thước thật của:
// - Image
// - Video
//
// Rất quan trọng vì Preview không còn coi
// background luôn là 640×360 nữa.
// ============================================================

async function getMediaDimensions(
input:
| string
| File
| Blob,
isImage: boolean
): Promise<{
width: number;
height: number;
}> {


const isBlobInput =
    input instanceof File ||
    input instanceof Blob;


const url =
    isBlobInput
        ? URL.createObjectURL(input)
        : input;


try {

    // ====================================================
    // IMAGE
    // ====================================================

    if (isImage) {

        const image =
            new Image();


        await new Promise<void>(
            (
                resolve,
                reject
            ) => {

                image.onload =
                    () => {
                        resolve();
                    };


                image.onerror =
                    () => {
                        reject(
                            new Error(
                                "Không thể đọc kích thước ảnh."
                            )
                        );
                    };


                image.src =
                    url;

            }
        );


        if (
            image.naturalWidth <= 0 ||
            image.naturalHeight <= 0
        ) {

            throw new Error(
                "Kích thước ảnh không hợp lệ."
            );

        }


        return {

            width:
                image.naturalWidth,

            height:
                image.naturalHeight,

        };

    }


    // ====================================================
    // VIDEO
    // ====================================================

    const video =
        document.createElement(
            "video"
        );


    video.preload =
        "metadata";


    video.muted =
        true;


    video.playsInline =
        true;


    await new Promise<void>(
        (
            resolve,
            reject
        ) => {

            const cleanup =
                () => {

                    video.onloadedmetadata =
                        null;

                    video.onerror =
                        null;

                };


            video.onloadedmetadata =
                () => {

                    cleanup();

                    resolve();

                };


            video.onerror =
                () => {

                    cleanup();

                    reject(
                        new Error(
                            "Không thể đọc kích thước video."
                        )
                    );

                };


            video.src =
                url;

        }
    );


    if (
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
    ) {

        throw new Error(
            "Kích thước video không hợp lệ."
        );

    }


    return {

        width:
            video.videoWidth,

        height:
            video.videoHeight,

    };

}
finally {

    if (isBlobInput) {

        URL.revokeObjectURL(
            url
        );

    }

}


}

// ============================================================
// CALCULATE COVER SIZE
//
// PHẢI GIỐNG KaraokeCanvas.tsx
//
// Canvas:
// 640 × 360
//
// Media được scale sao cho:
// - không lộ nền
// - giữ nguyên aspect ratio
//
// Ví dụ:
//
// 1920×1080
// -> 640×360
//
// 1080×1920
// -> 640×1137.78
// ============================================================

function calculateCoverMediaSize(
width: number,
height: number
): {
width: number;
height: number;
scale: number;
} {


if (
    width <= 0 ||
    height <= 0
) {

    return {

        width:
            DESIGN_WIDTH,

        height:
            DESIGN_HEIGHT,

        scale:
            1,

    };

}


const scale =
    Math.max(
        DESIGN_WIDTH / width,
        DESIGN_HEIGHT / height
    );


return {

    width:
        width * scale,

    height:
        height * scale,

    scale,

};


}

// ============================================================
// NORMALIZE LYRICS
// ============================================================

function normalizeLyrics(
lyrics: LyricLine[]
): LyricLine[] {


return lyrics.map(
    (
        line,
        lineIndex
    ) => ({

        ...line,

        id:
            line.id ??
            `line-${lineIndex}`,

        start:
            Number(
                line.start ?? 0
            ),

        end:
            Number(
                line.end ?? 0
            ),

        text:
            line.text ?? "",

        words:
            (
                line.words ?? []
            ).map(
                (
                    word,
                    wordIndex
                ) => ({

                    ...word,

                    id:
                        word.id ??
                        `line-${lineIndex}-word-${wordIndex}`,

                    word:
                        getWordText(
                            word
                        ),

                    start:
                        Number(
                            word.start ??
                            0
                        ),

                    end:
                        Number(
                            word.end ??
                            0
                        ),

                })
            ),

    })
);


}

// ============================================================
// WORD PROGRESS
// ============================================================

function getWordPercent(
word: LyricWord,
currentTime: number
): number {


const start =
    Number(
        word.start ?? 0
    );


const end =
    Number(
        word.end ?? 0
    );


if (
    !Number.isFinite(start) ||
    !Number.isFinite(end)
) {

    return 0;

}


if (
    end <= start
) {

    return currentTime >= end
        ? 100
        : 0;

}


if (
    currentTime <= start
) {

    return 0;

}


if (
    currentTime >= end
) {

    return 100;

}


return clamp(
    (
        (
            currentTime -
            start
        ) /
        (
            end -
            start
        )
    ) * 100,

    0,

    100
);


}

// ============================================================
// DRAW WORD
// ============================================================

function drawWord(
ctx: CanvasRenderingContext2D,


text: string,

x: number,

y: number,

style: Required<LyricStyle>,

color: string,

clipWidth?: number


) {


ctx.save();


const scale =
    EXPORT_SCALE;


const fontSize =
    style.fontSize *
    style.scale *
    scale;


const outlineWidth =
    style.outlineWidth *
    style.scale *
    scale;


// ========================================================
// FONT
// ========================================================

ctx.font =
    `${getFontWeight()} ${fontSize}px "${style.fontFamily}"`;


ctx.textBaseline =
    "middle";


ctx.textAlign =
    "left";


ctx.lineJoin =
    "round";


ctx.miterLimit =
    2;


// ========================================================
// SHADOW
// ========================================================

if (
    style.shadow
) {

    ctx.shadowColor =
        "rgba(0,0,0,0.6)";


    ctx.shadowBlur =
        4 *
        scale *
        style.scale;


    ctx.shadowOffsetX =
        0;


    ctx.shadowOffsetY =
        2 *
        scale *
        style.scale;

}


// ========================================================
// CLIP
// ========================================================

if (
    typeof clipWidth ===
    "number"
) {

    ctx.beginPath();


    ctx.rect(
        x,

        y -
            fontSize,

        clipWidth,

        fontSize * 2
    );


    ctx.clip();

}


// ========================================================
// OUTLINE
// ========================================================

if (
    outlineWidth > 0
) {

    ctx.strokeStyle =
        style.outline;


    ctx.lineWidth =
        outlineWidth;


    ctx.strokeText(
        text,
        x,
        y
    );

}


// ========================================================
// FILL
// ========================================================

ctx.fillStyle =
    color;


ctx.fillText(
    text,
    x,
    y
);


ctx.restore();

}

// ============================================================
// DRAW ONE LYRIC FRAME
// ============================================================

function drawLyricFrame(
canvas: HTMLCanvasElement,


lyrics: LyricLine[],

currentTime: number,

measureCtx: CanvasRenderingContext2D


) {


const ctx =
    canvas.getContext(
        "2d"
    );


if (!ctx) {

    throw new Error(
        "Không thể tạo Canvas context."
    );

}


// ========================================================
// CLEAR
// ========================================================

ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
);


// ========================================================
// DRAW ACTIVE LINES
// ========================================================

for (
    const line of lyrics
) {

    const lineStart =
        Number(
            line.start ?? 0
        );


    const lineEnd =
        Number(
            line.end ?? 0
        );


    if (
        currentTime < lineStart ||
        currentTime > lineEnd
    ) {

        continue;

    }


    const style =
        getLyricStyle(
            line
        );


    const words =
        line.words ?? [];


    if (
        !words.length
    ) {

        continue;

    }


    // ====================================================
    // SHARED LAYOUT
    //
    // Luôn tính ở 640×360.
    // ====================================================

    const layout =
        calculateLyricLayout(
            line,
            measureCtx
        );


    // ====================================================
    // Y
    // ====================================================

    const y =
        layout.y *
        EXPORT_SCALE;


    // ====================================================
    // WORDS
    // ====================================================

    for (
        let i = 0;
        i < layout.words.length;
        i++
    ) {

        const layoutWord =
            layout.words[i];


        const word =
            words[i];


        if (!word) {

            continue;

        }


        const text =
            getWordText(
                word
            );


        // =================================================
        // X
        // =================================================

        const currentX =
            layoutWord.x *
            EXPORT_SCALE;


        // =================================================
        // WIDTH
        // =================================================

        const wordWidth =
            layoutWord.width *
            EXPORT_SCALE;


        // =================================================
        // WORD PROGRESS
        // =================================================

        const percent =
            getWordPercent(
                word,
                currentTime
            );


        // =================================================
        // NORMAL
        // =================================================

        drawWord(
            ctx,

            text,

            currentX,

            y,

            style,

            style.color
        );


        // =================================================
        // ACTIVE
        // =================================================

        if (
            percent >= 100
        ) {

            drawWord(
                ctx,

                text,

                currentX,

                y,

                style,

                style.activeColor
            );

        }


        // =================================================
        // PARTIAL ACTIVE
        // =================================================

        else if (
            percent > 0 &&
            wordWidth > 0
        ) {

            const clipWidth =
                wordWidth *
                (
                    percent /
                    100
                );


            drawWord(
                ctx,

                text,

                currentX,

                y,

                style,

                style.activeColor,

                clipWidth
            );

        }

    }

}


}

// ============================================================
// CANVAS → PNG
// ============================================================

async function canvasToBlob(
canvas: HTMLCanvasElement
): Promise<Blob> {


return new Promise(
    (
        resolve,
        reject
    ) => {

        canvas.toBlob(
            (
                blob
            ) => {

                if (!blob) {

                    reject(
                        new Error(
                            "Không thể tạo PNG frame."
                        )
                    );

                    return;

                }


                resolve(
                    blob
                );

            },

            "image/png"
        );

    }
);


}

// ============================================================
// FETCH INPUT FILE
// ============================================================

async function getInputFile(
input:
| string
| File
| Blob,


fallbackName: string


): Promise<{
data: Uint8Array;
name: string;
}> {


// ========================================================
// FILE
// ========================================================

if (
    input instanceof File
) {

    return {

        data:
            new Uint8Array(
                await input.arrayBuffer()
            ),

        name:
            input.name ||
            fallbackName,

    };

}


// ========================================================
// BLOB
// ========================================================

if (
    input instanceof Blob
) {

    return {

        data:
            new Uint8Array(
                await input.arrayBuffer()
            ),

        name:
            fallbackName,

    };

}


// ========================================================
// URL
// ========================================================

const response =
    await fetch(
        input
    );


if (
    !response.ok
) {

    throw new Error(
        `Không thể đọc file: ${response.status}`
    );

}


const blob =
    await response.blob();


let extension =
    "";


if (
    blob.type ===
    "image/png"
) {

    extension =
        ".png";

}

else if (
    blob.type ===
    "image/jpeg"
) {

    extension =
        ".jpg";

}

else if (
    blob.type ===
    "image/webp"
) {

    extension =
        ".webp";

}

else if (
    blob.type ===
    "video/webm"
) {

    extension =
        ".webm";

}

else if (
    blob.type ===
    "video/mp4"
) {

    extension =
        ".mp4";

}

else if (
    blob.type ===
    "video/quicktime"
) {

    extension =
        ".mov";

}


const name =
    fallbackName.replace(
        /\.[^/.]+$/,
        ""
    ) +
    (
        extension ||
        ".bin"
    );


return {

    data:
        new Uint8Array(
            await blob.arrayBuffer()
        ),

    name,

};


}

// ============================================================
// REMOVE OLD FILE
// ============================================================

async function safeDelete(
engine: FFmpeg,
filename: string
) {


try {

    await engine.deleteFile(
        filename
    );

}
catch {

    // Ignore.

}


}

// ============================================================
// EXPORT VIDEO
// ============================================================

export async function exportVideo(


videoFile:
    | string
    | File
    | Blob,

imageFile:
    | string
    | File
    | Blob
    | null
    | undefined,

lyrics: LyricLine[],

duration: number,

onProgress?: (
    progress: number
) => void


): Promise<Blob> {


console.log(
    "[EXPORT] Starting..."
);


console.log(
    "[EXPORT] Video:",
    videoFile
);


console.log(
    "[EXPORT] Image:",
    imageFile
);


console.log(
    "[EXPORT] Duration:",
    duration
);


// ========================================================
// LOAD FFMPEG
// ========================================================

const engine =
    await loadFFmpeg();


// ========================================================
// NORMALIZE LYRICS
// ========================================================

const normalizedLyrics =
    normalizeLyrics(
        lyrics
    );


if (
    !normalizedLyrics.length
) {

    throw new Error(
        "Không có lyrics để export."
    );

}


if (
    !videoFile
) {

    throw new Error(
        "Chưa có video timing."
    );

}


const isImageMode =
    !!imageFile;


// ========================================================
// GET BACKGROUND MEDIA TRANSFORM
//
// Lấy đúng state hiện tại từ Preview.
//
// Preview:
// 640 × 360
//
// Export:
// 1920 × 1080
// ========================================================

const backgroundMedia =
    useEditorStore
        .getState()
        .backgroundMedia;


const backgroundX =
    backgroundMedia.x *
    EXPORT_SCALE;


const backgroundY =
    backgroundMedia.y *
    EXPORT_SCALE;


/*
 * KaraokeCanvas mới giới hạn scale
 * nhỏ nhất là 1.
 *
 * Giữ thêm protection ở export.
 */

const backgroundScale =
    Math.max(
        1,
        backgroundMedia.scale
    );


console.log(
    "[EXPORT] Background media state:",
    backgroundMedia
);


// ========================================================
// GET ORIGINAL MEDIA DIMENSIONS
// ========================================================

const backgroundInput =
    isImageMode
        ? imageFile!
        : videoFile;


const mediaDimensions =
    await getMediaDimensions(
        backgroundInput,
        isImageMode
    );


console.log(
    "[EXPORT] Original media:",
    mediaDimensions.width,
    "x",
    mediaDimensions.height
);


// ========================================================
// CALCULATE COVER SIZE
//
// PHẢI GIỐNG KaraokeCanvas.tsx
// ========================================================

const coverMedia =
    calculateCoverMediaSize(
        mediaDimensions.width,
        mediaDimensions.height
    );


console.log(
    "[EXPORT] Cover media:",
    coverMedia
);


// ========================================================
// BASE MEDIA SIZE
//
// Đây là kích thước ở Preview
// khi backgroundMedia.scale = 1.
//
// Ví dụ:
//
// 1920×1080
// -> 640×360
//
// 1080×1920
// -> 640×1137.78
// ========================================================

const baseWidth =
    coverMedia.width;


const baseHeight =
    coverMedia.height;


// ========================================================
// EXPORT MEDIA SIZE
//
// Preview:
//
// baseWidth × baseHeight
//
// Export:
//
// baseWidth × 3
// baseHeight × 3
//
// Sau đó áp dụng backgroundScale.
// ========================================================

const backgroundWidth =
    Math.round(
        baseWidth *
        EXPORT_SCALE *
        backgroundScale
    );


const backgroundHeight =
    Math.round(
        baseHeight *
        EXPORT_SCALE *
        backgroundScale
    );


// ========================================================
// BACKGROUND TOP LEFT
//
// Preview:
//
// left: x
// top: y
//
// transform:
// translate(-50%, -50%)
// scale(...)
//
// Export:
//
// centerX - width / 2
// centerY - height / 2
// ========================================================

const backgroundLeft =
    Math.round(
        backgroundX -
        backgroundWidth / 2
    );


const backgroundTop =
    Math.round(
        backgroundY -
        backgroundHeight / 2
    );


console.log(
    "[EXPORT] Background geometry:",
    {

        originalWidth:
            mediaDimensions.width,

        originalHeight:
            mediaDimensions.height,

        coverScale:
            coverMedia.scale,

        baseWidth,

        baseHeight,

        exportWidth:
            backgroundWidth,

        exportHeight:
            backgroundHeight,

        x:
            backgroundX,

        y:
            backgroundY,

        left:
            backgroundLeft,

        top:
            backgroundTop,

        scale:
            backgroundScale,

    }
);


// ========================================================
// MEASURE CANVAS
//
// 640 × 360
//
// Đây là coordinate system chung
// Preview + Export.
// ========================================================

const measureCanvas =
    document.createElement(
        "canvas"
    );


measureCanvas.width =
    EXPORT_WIDTH /
    EXPORT_SCALE;


measureCanvas.height =
    EXPORT_HEIGHT /
    EXPORT_SCALE;


const measureCtx =
    measureCanvas.getContext(
        "2d"
    );


if (!measureCtx) {

    throw new Error(
        "Không thể tạo measure canvas."
    );

}


await document.fonts.ready;


// ========================================================
// RENDER CANVAS
//
// 1920 × 1080
//
// Chỉ chứa lyrics.
//
// Background do FFmpeg xử lý.
// ========================================================

const renderCanvas =
    document.createElement(
        "canvas"
    );


renderCanvas.width =
    EXPORT_WIDTH;


renderCanvas.height =
    EXPORT_HEIGHT;


// ========================================================
// FILE NAMES
// ========================================================

const inputVideoName =
    "input-video";

const inputImageName =
    "background-image";

const outputName =
    "output.mp4";

const framePattern =
    "frame-%07d.png";


// ========================================================
// CLEAN OLD FILES
// ========================================================

await safeDelete(
    engine,
    inputVideoName
);


await safeDelete(
    engine,
    inputImageName
);


await safeDelete(
    engine,
    outputName
);


// ========================================================
// WRITE VIDEO
// ========================================================

onProgress?.(
    2
);


const videoInput =
    await getInputFile(
        videoFile,
        "input-video.mp4"
    );


await engine.writeFile(
    inputVideoName,
    videoInput.data
);


console.log(
    "[EXPORT] Video written:",
    videoInput.name
);


// ========================================================
// WRITE IMAGE
// ========================================================

if (
    isImageMode
) {

    const imageInput =
        await getInputFile(
            imageFile!,
            "background-image.png"
        );


    await engine.writeFile(
        inputImageName,
        imageInput.data
    );


    console.log(
        "[EXPORT] Image written:",
        imageInput.name
    );

}


// ========================================================
// GENERATE LYRIC PNG FRAMES
// ========================================================

const totalFrames =
    Math.ceil(
        duration *
        EXPORT_FPS
    );


console.log(
    "[EXPORT] Total lyric frames:",
    totalFrames
);


for (
    let frame = 0;
    frame < totalFrames;
    frame++
) {

    const currentTime =
        frame /
        EXPORT_FPS;


    drawLyricFrame(
        renderCanvas,

        normalizedLyrics,

        currentTime,

        measureCtx
    );


    const blob =
        await canvasToBlob(
            renderCanvas
        );


    const bytes =
        new Uint8Array(
            await blob.arrayBuffer()
        );


    const filename =
        `frame-${String(
            frame
        ).padStart(
            7,
            "0"
        )}.png`;


    await engine.writeFile(
        filename,
        bytes
    );


    const frameProgress =
        (
            (frame + 1) /
            totalFrames
        ) *
        45;


    onProgress?.(
        Math.round(
            5 +
            frameProgress
        )
    );


    if (
        frame % 30 === 0
    ) {

        console.log(
            "[EXPORT] Frame:",
            frame + 1,
            "/",
            totalFrames
        );

    }

}


// ========================================================
// FFMPEG ARGS
// ========================================================

let args: string[];


// ========================================================
// COMMON FILTER GEOMETRY
//
// Canvas cố định:
//
// 1920 × 1080
//
// Background có thể lớn hơn canvas.
//
// Vì vậy KHÔNG overlay lyrics trực tiếp
// lên background.
//
// Phải:
//
// black canvas
//      ↓
// background
//      ↓
// lyrics
//
// Đây là điểm rất quan trọng để export
// không bị đổi kích thước output khi zoom.
// ========================================================


const backgroundFilter =
    `[0:v]` +
    `format=rgba,` +
    `scale=${backgroundWidth}:${backgroundHeight},` +
    `fps=${EXPORT_FPS},` +
    `format=rgba` +
    `[bg];`;


const baseCanvasFilter =
    `color=c=black:s=${EXPORT_WIDTH}x${EXPORT_HEIGHT}:r=${EXPORT_FPS},` +
    `format=rgba` +
    `[base];`;


const lyricsInputIndex =
    isImageMode
        ? 1
        : 1;


const composeBackground =
    `[base][bg]` +
    `overlay=` +
    `${backgroundLeft}:` +
    `${backgroundTop}:` +
    `eof_action=pass` +
    `[withbg];`;


const composeLyrics =
    `[withbg][${lyricsInputIndex}:v]` +
    `overlay=0:0:` +
    `eof_action=pass` +
    `[outv]`;


// ========================================================
// IMAGE MODE
//
// imageFile:
//     background
//
// videoFile:
//     timing + audio
//
// Input indexes:
//
// 0 = image
// 1 = lyrics
// 2 = timing video
// ========================================================

if (
    isImageMode
) {

    args = [

        // ------------------------------------------------
        // IMAGE
        // ------------------------------------------------

        "-loop",

        "1",

        "-i",

        inputImageName,


        // ------------------------------------------------
        // LYRIC FRAMES
        // ------------------------------------------------

        "-framerate",

        String(
            EXPORT_FPS
        ),

        "-i",

        framePattern,


        // ------------------------------------------------
        // TIMING VIDEO / AUDIO
        // ------------------------------------------------

        "-i",

        inputVideoName,


        // ------------------------------------------------
        // FILTER
        // ------------------------------------------------

        "-filter_complex",

        // Background
        backgroundFilter +

        // Black 1920×1080 canvas
        baseCanvasFilter +

        // Background onto canvas
        composeBackground +

        // Lyrics onto canvas
        composeLyrics,


        // ------------------------------------------------
        // VIDEO
        // ------------------------------------------------

        "-map",

        "[outv]",


        // ------------------------------------------------
        // AUDIO
        // ------------------------------------------------

        "-map",

        "2:a?",


        // ------------------------------------------------
        // DURATION
        // ------------------------------------------------

        "-t",

        String(
            duration
        ),


        // ------------------------------------------------
        // FPS
        // ------------------------------------------------

        "-r",

        String(
            EXPORT_FPS
        ),

        "-fps_mode",

        "cfr",


        // ------------------------------------------------
        // H264
        // ------------------------------------------------

        "-c:v",

        "libx264",

        "-preset",

        "ultrafast",

        "-crf",

        "23",

        "-pix_fmt",

        "yuv420p",


        // ------------------------------------------------
        // AUDIO
        // ------------------------------------------------

        "-c:a",

        "aac",

        "-b:a",

        "192k",


        // ------------------------------------------------
        // MP4
        // ------------------------------------------------

        "-movflags",

        "+faststart",

        "-y",

        outputName,

    ];

}


// ========================================================
// VIDEO MODE
//
// Không có imageFile:
//
// video = background + timing + audio
//
// Input indexes:
//
// 0 = video
// 1 = lyrics
// ========================================================

else {

    args = [

        // ------------------------------------------------
        // VIDEO BACKGROUND
        // ------------------------------------------------

        "-i",

        inputVideoName,


        // ------------------------------------------------
        // LYRIC FRAMES
        // ------------------------------------------------

        "-framerate",

        String(
            EXPORT_FPS
        ),

        "-i",

        framePattern,


        // ------------------------------------------------
        // FILTER
        // ------------------------------------------------

        "-filter_complex",

        // Background
        backgroundFilter +

        // Black canvas
        baseCanvasFilter +

        // Background onto canvas
        composeBackground +

        // Lyrics onto canvas
        composeLyrics,


        // ------------------------------------------------
        // VIDEO
        // ------------------------------------------------

        "-map",

        "[outv]",


        // ------------------------------------------------
        // AUDIO
        // ------------------------------------------------

        "-map",

        "0:a?",


        // ------------------------------------------------
        // DURATION
        // ------------------------------------------------

        "-t",

        String(
            duration
        ),


        // ------------------------------------------------
        // FPS
        // ------------------------------------------------

        "-r",

        String(
            EXPORT_FPS
        ),

        "-fps_mode",

        "cfr",


        // ------------------------------------------------
        // H264
        // ------------------------------------------------

        "-c:v",

        "libx264",

        "-preset",

        "ultrafast",

        "-crf",

        "23",

        "-pix_fmt",

        "yuv420p",


        // ------------------------------------------------
        // AUDIO
        // ------------------------------------------------

        "-c:a",

        "aac",

        "-b:a",

        "192k",


        // ------------------------------------------------
        // MP4
        // ------------------------------------------------

        "-movflags",

        "+faststart",

        "-y",

        outputName,

    ];

}


// ========================================================
// LOG
// ========================================================

console.log(
    "[EXPORT] MODE:",
    isImageMode
        ? "IMAGE"
        : "VIDEO"
);


console.log(
    "[EXPORT] FPS:",
    EXPORT_FPS
);


console.log(
    "[EXPORT] Total frames:",
    totalFrames
);


console.log(
    "[EXPORT] Background:",
    {

        x:
            backgroundMedia.x,

        y:
            backgroundMedia.y,

        scale:
            backgroundMedia.scale,

        originalWidth:
            mediaDimensions.width,

        originalHeight:
            mediaDimensions.height,

        coverScale:
            coverMedia.scale,

        baseWidth,

        baseHeight,

        exportWidth:
            backgroundWidth,

        exportHeight:
            backgroundHeight,

        left:
            backgroundLeft,

        top:
            backgroundTop,

    }
);


console.log(
    "[EXPORT] FFmpeg args:",
    args
);


// ========================================================
// FFMPEG EXPORT
// ========================================================

onProgress?.(
    50
);


const progressHandler =
    ({
        progress,
    }: {
        progress: number;
    }) => {

        const safe =
            clamp(
                progress,
                0,
                1
            );


        const value =
            50 +
            safe * 49;


        onProgress?.(
            Math.round(
                value
            )
        );

    };


engine.on(
    "progress",
    progressHandler
);


try {

    await engine.exec(
        args
    );

}

catch (
    error
) {

    console.error(
        "[EXPORT] FFmpeg ERROR:",
        error
    );


    throw error;

}

finally {

    engine.off(
        "progress",
        progressHandler
    );

}


// ========================================================
// READ OUTPUT
// ========================================================

onProgress?.(
    99
);


const outputData =
    await engine.readFile(
        outputName
    );


if (
    typeof outputData ===
    "string"
) {

    throw new Error(
        "FFmpeg trả về output không hợp lệ."
    );

}


const outputBytes =
    new Uint8Array(
        outputData
    );


const outputBlob =
    new Blob(
        [
            outputBytes,
        ],
        {
            type:
                "video/mp4",
        }
    );


// ========================================================
// CLEAN OUTPUT / INPUT
// ========================================================

await safeDelete(
    engine,
    outputName
);


await safeDelete(
    engine,
    inputVideoName
);


if (
    isImageMode
) {

    await safeDelete(
        engine,
        inputImageName
    );

}


// ========================================================
// CLEAN LYRIC FRAMES
// ========================================================

for (
    let frame = 0;
    frame < totalFrames;
    frame++
) {

    await safeDelete(
        engine,

        `frame-${String(
            frame
        ).padStart(
            7,
            "0"
        )}.png`
    );

}


// ========================================================
// DONE
// ========================================================

onProgress?.(
    100
);


console.log(
    "[EXPORT] SUCCESS",
    outputBlob.size
);


return outputBlob;


}
