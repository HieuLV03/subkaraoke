
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

import {
    EXPORT_WIDTH,
    EXPORT_HEIGHT,
    EXPORT_SCALE,
    calculateLyricLayout,
    getLyricStyle,
    getWordText,
    getCanvasFont,
} from "../components/karaoke/KaraokeLayout";

// ============================================================
// CONFIG
// ============================================================

const EXPORT_FPS = 20;
const FFMPEG_CORE_VERSION = "0.12.10";

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

    align?: "left" | "center" | "right";
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
    if (ffmpeg && ffmpegLoaded) {
        return ffmpeg;
    }

    console.log("[FFMPEG] Loading...");

    const instance = new FFmpeg();

    instance.on("log", ({ message }) => {
        console.log("[FFMPEG]", message);
    });

    instance.on("progress", ({ progress }) => {
        console.log(
            "[FFMPEG PROGRESS]",
            Math.round(progress * 100),
            "%"
        );
    });

    const baseURL =
        `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

    const coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
    );

    const wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
    );

    await instance.load({
        coreURL,
        wasmURL,
    });

    ffmpeg = instance;
    ffmpegLoaded = true;

    console.log("[FFMPEG] Loaded.");

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
        Math.min(max, value)
    );
}

// ============================================================
// NORMALIZE LYRICS
// ============================================================

function normalizeLyrics(
    lyrics: LyricLine[]
): LyricLine[] {
    return lyrics.map(
        (line, lineIndex) => ({
            ...line,

            id:
                line.id ??
                `line-${lineIndex}`,

            start:
                Number(line.start ?? 0),

            end:
                Number(line.end ?? 0),

            text:
                line.text ?? "",

            words:
                (line.words ?? []).map(
                    (word, wordIndex) => ({
                        ...word,

                        id:
                            word.id ??
                            `line-${lineIndex}-word-${wordIndex}`,

                        word:
                            getWordText(word),

                        start:
                            Number(
                                word.start ?? 0
                            ),

                        end:
                            Number(
                                word.end ?? 0
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
        Number(word.start ?? 0);

    const end =
        Number(word.end ?? 0);

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end)
    ) {
        return 0;
    }

    if (end <= start) {
        return currentTime >= end
            ? 100
            : 0;
    }

    if (currentTime <= start) {
        return 0;
    }

    if (currentTime >= end) {
        return 100;
    }

    return clamp(
        (
            (currentTime - start) /
            (end - start)
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

    // Preview → Export
    const scale =
        EXPORT_SCALE * style.scale;

    const fontSize =
        style.fontSize * scale;

    const outlineWidth =
        style.outlineWidth * scale;

    // ========================================================
    // FONT
    // ========================================================

    ctx.font =
        getCanvasFont(
            style,
            scale
        );

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    // ========================================================
    // SHADOW
    // ========================================================

    if (style.shadow) {
        ctx.shadowColor =
            "rgba(0,0,0,0.6)";

        ctx.shadowBlur =
            4 * scale;

        ctx.shadowOffsetX = 0;

        ctx.shadowOffsetY =
            2 * scale;
    }

    // ========================================================
    // CLIP
    // ========================================================

    if (
        typeof clipWidth === "number"
    ) {
        ctx.beginPath();

        ctx.rect(
            x,
            y - fontSize,
            clipWidth,
            fontSize * 2
        );

        ctx.clip();
    }

    // ========================================================
    // OUTLINE
    // ========================================================

    if (outlineWidth > 0) {
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
        canvas.getContext("2d");

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

    for (const line of lyrics) {
        const lineStart =
            Number(line.start ?? 0);

        const lineEnd =
            Number(line.end ?? 0);

        if (
            currentTime < lineStart ||
            currentTime > lineEnd
        ) {
            continue;
        }

        const style =
            getLyricStyle(line);

        const words =
            line.words ?? [];

        if (!words.length) {
            continue;
        }

        // ====================================================
        // SHARED LAYOUT
        // ====================================================

        const layout =
            calculateLyricLayout(
                line,
                measureCtx
            );

        // ====================================================
        // PREVIEW 640x360
        // →
        // EXPORT 1920x1080
        // ====================================================

        const y =
            layout.y *
            EXPORT_SCALE;

        // ====================================================
        // DRAW WORDS
        //
        // layoutWord.x đã được calculateLyricLayout()
        // tính sẵn.
        //
        // Không tính currentX thủ công nữa.
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

            const text =
                getWordText(word);

            // ------------------------------------------------
            // X của word trong Preview → Export
            // ------------------------------------------------

            const currentX =
                layoutWord.x *
                EXPORT_SCALE;

            // ------------------------------------------------
            // Width của word đã bao gồm style.scale
            // trong calculateLyricLayout().
            //
            // Vì vậy KHÔNG nhân style.scale lần nữa.
            // ------------------------------------------------

            const wordWidth =
                layoutWord.width *
                EXPORT_SCALE;

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

            if (percent >= 100) {
                drawWord(
                    ctx,
                    text,
                    currentX,
                    y,
                    style,
                    style.activeColor
                );
            }
            else if (
                percent > 0 &&
                wordWidth > 0
            ) {
                const clipWidth =
                    wordWidth *
                    (percent / 100);

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
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error(
                                "Không thể tạo PNG frame."
                            )
                        );

                        return;
                    }

                    resolve(blob);
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
    input: string | File | Blob,
    fallbackName: string
): Promise<{
    data: Uint8Array;
    name: string;
}> {
    // ========================================================
    // FILE
    // ========================================================

    if (input instanceof File) {
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

    if (input instanceof Blob) {
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
        await fetch(input);

    if (!response.ok) {
        throw new Error(
            `Không thể đọc file: ${response.status}`
        );
    }

    const blob =
        await response.blob();

    let extension = "";

    if (
        blob.type ===
        "image/png"
    ) {
        extension = ".png";
    }
    else if (
        blob.type ===
        "image/jpeg"
    ) {
        extension = ".jpg";
    }
    else if (
        blob.type ===
        "image/webp"
    ) {
        extension = ".webp";
    }
    else if (
        blob.type ===
        "video/webm"
    ) {
        extension = ".webm";
    }
    else if (
        blob.type ===
        "video/mp4"
    ) {
        extension = ".mp4";
    }
    else if (
        blob.type ===
        "video/quicktime"
    ) {
        extension = ".mov";
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
    videoFile: string | File | Blob,

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

    if (!videoFile) {
        throw new Error(
            "Chưa có video timing."
        );
    }

    const isImageMode =
        !!imageFile;

    // ========================================================
    // MEASURE CANVAS
    //
    // Dùng đúng hệ tọa độ Preview:
    //
    // 640 x 360
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
    // 1920 x 1080
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

    onProgress?.(2);

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

    if (isImageMode) {
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
    // IMAGE MODE
    // ========================================================

    if (isImageMode) {
        args = [

            // ------------------------------------------------
            // BACKGROUND IMAGE
            // ------------------------------------------------

            "-i",
            inputImageName,

            // ------------------------------------------------
            // LYRIC FRAMES
            // ------------------------------------------------

            "-framerate",
            String(EXPORT_FPS),

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

            `[0:v]` +
            `format=rgba,` +
            `scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:` +
            `force_original_aspect_ratio=increase,` +
            `crop=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:(iw-ow)/2:(ih-oh)/2,` +
            `loop=loop=-1:size=1:start=0,` +
            `fps=${EXPORT_FPS},` +
            `format=yuv420p[bg];` +

            `[1:v]` +
            `format=rgba[lyrics];` +

            `[bg][lyrics]` +
            `overlay=0:0[outv]`,

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
            String(duration),

            // ------------------------------------------------
            // FPS
            // ------------------------------------------------

            "-r",
            String(EXPORT_FPS),

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
            String(EXPORT_FPS),

            "-i",
            framePattern,

            // ------------------------------------------------
            // FILTER
            // ------------------------------------------------

            "-filter_complex",

            `[0:v]` +
            `scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:` +
            `force_original_aspect_ratio=increase,` +
            `crop=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:(iw-ow)/2:(ih-oh)/2,` +
            `fps=${EXPORT_FPS},` +
            `format=yuv420p[bg];` +

            `[1:v]` +
            `format=rgba[lyrics];` +

            `[bg][lyrics]` +
            `overlay=0:0[outv]`,

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
            String(duration),

            // ------------------------------------------------
            // FPS
            // ------------------------------------------------

            "-r",
            String(EXPORT_FPS),

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
        "[EXPORT] FFmpeg args:",
        args
    );

    // ========================================================
    // FFMPEG EXPORT
    // ========================================================

    onProgress?.(50);

    const progressHandler = ({
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
            Math.round(value)
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
    catch (error) {
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

    onProgress?.(99);

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
            [outputBytes],
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

    if (isImageMode) {
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

    onProgress?.(100);

    console.log(
        "[EXPORT] SUCCESS",
        outputBlob.size
    );

    return outputBlob;
}
