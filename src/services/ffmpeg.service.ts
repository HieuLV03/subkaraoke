import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// ============================================================
// CONFIG
// ============================================================

const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 720;
const EXPORT_FPS = 21;

const FFMPEG_CORE_VERSION = "0.12.10";

const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 360;

const PREVIEW_SCALE =
    EXPORT_WIDTH / PREVIEW_WIDTH;

const WORD_GAP = 12;

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
) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function getText(word: LyricWord) {
    return String(
        word.word ??
        word.text ??
        ""
    );
}

function getDefaultStyle(): Required<LyricStyle> {
    return {
        fontFamily: "Arial",
        fontSize: 120,
        color: "#ffffff",
        activeColor: "#00ff66",
        outline: "#000000",
        outlineWidth: 6,
        shadow: true,
        x: 320,
        y: 180,
        scale: 1,
        align: "center",
    };
}

function getStyle(
    line: LyricLine
): Required<LyricStyle> {
    return {
        ...getDefaultStyle(),
        ...(line.style ?? {}),
    };
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
                            getText(word),

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
) {
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
// CANVAS FONT
// ============================================================

function buildFont(
    style: Required<LyricStyle>
) {
    return `700 ${style.fontSize}px "${style.fontFamily}"`;
}

// ============================================================
// MEASURE WORDS
// ============================================================

function prepareMeasuredLyrics(
    lyrics: LyricLine[],
    measureCanvas: HTMLCanvasElement
) {
    const ctx =
        measureCanvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Không thể tạo Canvas 2D."
        );
    }

    const cache =
        new Map<string, number>();

    for (const line of lyrics) {
        const style =
            getStyle(line);

        ctx.font =
            buildFont(style);

        for (const word of line.words ?? []) {
            const text =
                getText(word);

            const key =
                JSON.stringify({
                    text,
                    font: ctx.font,
                });

            if (cache.has(key)) {
                word.measuredWidth =
                    cache.get(key) ?? 0;

                continue;
            }

            const width =
                ctx.measureText(text).width;

            cache.set(
                key,
                width
            );

            word.measuredWidth =
                width;

            console.log(
                "[MEASURE]",
                JSON.stringify(text),
                "font:",
                ctx.font,
                "width:",
                width
            );
        }
    }

    return lyrics;
}

// ============================================================
// WORD WIDTH
// ============================================================

function getWordWidth(
    word: LyricWord,
    style: Required<LyricStyle>
) {
    const measured =
        Number(
            word.measuredWidth ?? 0
        );

    if (
        !Number.isFinite(measured) ||
        measured <= 0
    ) {
        return 0;
    }

    return (
        measured *
        PREVIEW_SCALE *
        style.scale
    );
}

// ============================================================
// DRAW TEXT
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

    const fontSize =
        style.fontSize *
        PREVIEW_SCALE *
        style.scale;

    const outlineWidth =
        style.outlineWidth *
        PREVIEW_SCALE *
        style.scale;

    ctx.font =
        `700 ${fontSize}px "${style.fontFamily}"`;

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

    if (style.shadow) {
        ctx.shadowColor =
            "rgba(0,0,0,0.8)";

        ctx.shadowBlur =
            6;

        ctx.shadowOffsetX =
            3;

        ctx.shadowOffsetY =
            3;
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
    currentTime: number
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
            getStyle(line);

        const words =
            line.words ?? [];

        if (!words.length) {
            continue;
        }

        const scale =
            style.scale;

        const wordWidths =
            words.map(
                word =>
                    getWordWidth(
                        word,
                        style
                    )
            );

        const gap =
            WORD_GAP *
            PREVIEW_SCALE *
            scale;

        const totalWidth =
            wordWidths.reduce(
                (
                    total,
                    width
                ) =>
                    total + width,
                0
            ) +
            Math.max(
                0,
                words.length - 1
            ) *
            gap;

        const centerX =
            style.x *
            PREVIEW_SCALE;

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

        const y =
            style.y *
            PREVIEW_SCALE;

        let currentX =
            startX;

        for (
            let i = 0;
            i < words.length;
            i++
        ) {
            const word =
                words[i];

            const text =
                getText(word);

            const wordWidth =
                wordWidths[i];

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

            currentX +=
                wordWidth;

            if (
                i <
                words.length - 1
            ) {
                currentX +=
                    gap;
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
                blob => {
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
        await fetch(input);

    if (!response.ok) {
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

    const engine =
        await loadFFmpeg();

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
    // CANVAS
    // ========================================================

    const measureCanvas =
        document.createElement(
            "canvas"
        );

    measureCanvas.width =
        EXPORT_WIDTH;

    measureCanvas.height =
        EXPORT_HEIGHT;

    prepareMeasuredLyrics(
        normalizedLyrics,
        measureCanvas
    );

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
            currentTime
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
    //
    // input 0 = ONE background image
    // input 1 = lyric PNG frames
    // input 2 = timing video / audio
    //
    // IMPORTANT FIX:
    //
    // KHÔNG dùng:
    //
    // -loop 1
    // -framerate 21
    // -i background-image
    //
    // Vì cách đó khiến FFmpeg decode PNG
    // liên tục như một video input.
    //
    // Thay vào đó:
    //
    // PNG chỉ được đọc 1 frame.
    //
    // Sau đó filter:
    //
    // loop=loop=-1:size=1:start=0
    //
    // sẽ clone chính frame đó.
    //
    // Như vậy ảnh nền luôn giống hệt nhau.
    // ========================================================

    if (isImageMode) {

        args = [

            // =================================================
            // BACKGROUND IMAGE
            //
            // READ ONLY ONE FRAME
            // =================================================

            "-i",
            inputImageName,

            // =================================================
            // LYRIC FRAMES
            // =================================================

            "-framerate",
            String(EXPORT_FPS),

            "-i",
            framePattern,

            // =================================================
            // TIMING VIDEO / AUDIO
            // =================================================

            "-i",
            inputVideoName,

            // =================================================
            // FILTER
            // =================================================

            "-filter_complex",

            `[0:v]` +

            // -------------------------------------------------
            // Convert image to RGBA first
            // -------------------------------------------------

            `format=rgba,` +

            // -------------------------------------------------
            // Scale image
            // -------------------------------------------------

            `scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:` +
            `force_original_aspect_ratio=decrease,` +

            // -------------------------------------------------
            // Center image
            // -------------------------------------------------

            `pad=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:` +
            `(ow-iw)/2:(oh-ih)/2,` +

            // -------------------------------------------------
            // IMPORTANT:
            //
            // Repeat ONE decoded frame.
            //
            // No repeated PNG decoding.
            // -------------------------------------------------

            `loop=loop=-1:size=1:start=0,` +

            // -------------------------------------------------
            // Force constant FPS
            // -------------------------------------------------

            `fps=${EXPORT_FPS},` +

            // -------------------------------------------------
            // Convert background to YUV
            // -------------------------------------------------

            `format=yuv420p[bg];` +

            // -------------------------------------------------
            // LYRIC STREAM
            // -------------------------------------------------

            `[1:v]` +

            `format=rgba[lyrics];` +

            // -------------------------------------------------
            // OVERLAY
            // -------------------------------------------------

            `[bg][lyrics]` +

            `overlay=0:0:format=yuv420[outv]`,

            // =================================================
            // VIDEO MAP
            // =================================================

            "-map",
            "[outv]",

            // =================================================
            // AUDIO MAP
            // =================================================

            "-map",
            "2:a?",

            // =================================================
            // DURATION
            // =================================================

            "-t",
            String(duration),

            // =================================================
            // FPS
            // =================================================

            "-r",
            String(EXPORT_FPS),

            "-fps_mode",
            "cfr",

            // =================================================
            // H264
            // =================================================

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-crf",
            "23",

            "-pix_fmt",
            "yuv420p",

            // =================================================
            // AUDIO
            // =================================================

            "-c:a",
            "aac",

            "-b:a",
            "192k",

            // =================================================
            // MP4
            // =================================================

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

            // =================================================
            // VIDEO BACKGROUND
            // =================================================

            "-i",
            inputVideoName,

            // =================================================
            // LYRIC FRAMES
            // =================================================

            "-framerate",
            String(EXPORT_FPS),

            "-i",
            framePattern,

            // =================================================
            // FILTER
            // =================================================

            "-filter_complex",

            `[0:v]` +

          `scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:` +
`force_original_aspect_ratio=increase,` +
`crop=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:(iw-ow)/2:(ih-oh)/2,` +

            `[1:v]` +

            `format=rgba[lyrics];` +

            `[bg][lyrics]` +

            `overlay=0:0:format=yuv420[outv]`,

            // =================================================
            // VIDEO
            // =================================================

            "-map",
            "[outv]",

            // =================================================
            // AUDIO
            // =================================================

            "-map",
            "0:a?",

            // =================================================
            // DURATION
            // =================================================

            "-t",
            String(duration),

            // =================================================
            // FPS
            // =================================================

            "-r",
            String(EXPORT_FPS),

            "-fps_mode",
            "cfr",

            // =================================================
            // H264
            // =================================================

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-crf",
            "23",

            "-pix_fmt",
            "yuv420p",

            // =================================================
            // AUDIO
            // =================================================

            "-c:a",
            "aac",

            "-b:a",
            "192k",

            // =================================================
            // MP4
            // =================================================

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