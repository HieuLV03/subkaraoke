import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ============================================================
// FFMPEG
// ============================================================

const ffmpeg = new FFmpeg();

let loaded = false;

// ============================================================
// CONSTANTS
// ============================================================

const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 360;

const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 720;

const EXPORT_SCALE =
    EXPORT_WIDTH / PREVIEW_WIDTH;

// ============================================================
// HELPERS
// ============================================================

function assTime(seconds: number): string {
    const safe = Math.max(0, seconds);

    const hours =
        Math.floor(safe / 3600);

    const minutes =
        Math.floor(
            (safe % 3600) / 60
        );

    const secs =
        Math.floor(safe % 60);

    const centiseconds =
        Math.floor(
            (safe - Math.floor(safe)) * 100
        );

    return (
        `${hours}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(secs).padStart(2, "0")}.` +
        `${String(centiseconds).padStart(2, "0")}`
    );
}

// ============================================================
// COLOR
// ============================================================

function assColor(
    color: string
): string {

    if (!color) {
        return "&H00FFFFFF";
    }

    const hex =
        color
            .replace("#", "")
            .trim();

    if (hex.length !== 6) {
        return "&H00FFFFFF";
    }

    const r =
        hex.substring(0, 2);

    const g =
        hex.substring(2, 4);

    const b =
        hex.substring(4, 6);

    // ASS uses BBGGRR
    return `&H00${b}${g}${r}`;
}

// ============================================================
// ESCAPE ASS
// ============================================================

function escapeASS(
    text: string
): string {

    return String(
        text ?? ""
    )
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}");
}

// ============================================================
// GET WORD TEXT
// ============================================================

function getText(
    word: any
): string {

    return String(
        word?.word ??
        word?.text ??
        ""
    );
}

// ============================================================
// MEASURE TEXT
// ============================================================

function measureWord(
    text: string,
    fontFamily: string,
    fontSize: number
): number {

    if (
        typeof document === "undefined"
    ) {

        return (
            text.length *
            fontSize *
            0.55
        );
    }

    const canvas =
        document.createElement(
            "canvas"
        );

    const context =
        canvas.getContext(
            "2d"
        );

    if (!context) {

        return (
            text.length *
            fontSize *
            0.55
        );
    }

    context.font =
        `${fontSize}px ${fontFamily}`;

    return context.measureText(
        text
    ).width;
}

// ============================================================
// NORMALIZE LYRICS
// ============================================================

function normalizeLyrics(
    input: any
): any[] {

    if (
        Array.isArray(input)
    ) {
        return input;
    }

    if (
        Array.isArray(input?.lyrics)
    ) {
        return input.lyrics;
    }

    if (
        Array.isArray(input?.lines)
    ) {
        return input.lines;
    }

    if (
        Array.isArray(input?.items)
    ) {
        return input.items;
    }

    console.error(
        "[FFMPEG] Invalid lyrics:",
        input
    );

    return [];
}

// ============================================================
// BUILD ASS
// ============================================================

function buildASS(
    inputLyrics: any
): string {

    const lyrics =
        normalizeLyrics(
            inputLyrics
        );

    const events: string[] = [];

    // ========================================================
    // SCRIPT HEADER
    // ========================================================

    const header = `
[Script Info]
ScriptType: v4.00+
PlayResX: ${EXPORT_WIDTH}
PlayResY: ${EXPORT_HEIGHT}
ScaledBorderAndShadow: yes
WrapStyle: 2
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,Arial,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,4,2,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`.trim();

    // ========================================================
    // LYRICS
    // ========================================================

    for (
        const line of lyrics
    ) {

        if (
            !line ||
            !Array.isArray(line.words) ||
            line.words.length === 0
        ) {
            continue;
        }

        const words =
            line.words.filter(
                (word: any) =>
                    getText(word)
                        .trim()
                        .length > 0
            );

        if (
            words.length === 0
        ) {
            continue;
        }

        // ====================================================
        // STYLE
        // ====================================================

        const lineStyle =
            line.style ?? {};

        const fontFamily =
            lineStyle.fontFamily ??
            "Arial";

        const fontSize =
            Number(
                lineStyle.fontSize ?? 21
            );

        const textColor =
            lineStyle.color ??
            "#ffffff";

        const activeColor =
            lineStyle.activeColor ??
            "#00ff66";

        const outlineColor =
            lineStyle.outline ??
            "#000000";

        const outlineWidth =
            Number(
                lineStyle.outlineWidth ?? 2
            );

        const shadow =
            lineStyle.shadow ??
            true;

        // Preview canvas = 640x360
        // Export = 1280x720
        const x =
            Number(
                lineStyle.x ?? 330
            ) *
            EXPORT_SCALE;

        const y =
            Number(
                lineStyle.y ?? 180
            ) *
            EXPORT_SCALE;

        const align =
            lineStyle.align ??
            "center";

        // ====================================================
        // EXPORT STYLE
        // ====================================================

        const exportFontSize =
            fontSize *
            EXPORT_SCALE;

        const exportOutline =
            outlineWidth *
            EXPORT_SCALE;

        const shadowValue =
            shadow
                ? 2
                : 0;

        const normalColor =
            assColor(
                textColor
            );

        const activeColorASS =
            assColor(
                activeColor
            );

        const outlineColorASS =
            assColor(
                outlineColor
            );

        // ====================================================
        // LINE TIMING
        // ====================================================

        const start =
            Number(
                line.start ?? 0
            );

        const end =
            Number(
                line.end ?? start
            );

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end <= start
        ) {
            continue;
        }

        // ====================================================
        // MEASURE WORDS
        // ====================================================

        const measuredWords =
            words.map(
                (word: any) => {

                    const text =
                        getText(word);

                    const width =
                        measureWord(
                            text,
                            fontFamily,
                            fontSize
                        ) *
                        EXPORT_SCALE;

                    return {
                        word,
                        text,
                        width,
                    };
                }
            );

        const spaceWidth =
            measureWord(
                " ",
                fontFamily,
                fontSize
            ) *
            EXPORT_SCALE;

        // ====================================================
        // TOTAL WIDTH
        // ====================================================

        const totalWidth =
            measuredWords.reduce(
                (
                    total: number,
                    item: {
                        word: any;
                        text: string;
                        width: number;
                    }
                ) => {

                    return (
                        total +
                        item.width
                    );
                },
                0
            ) +
            Math.max(
                0,
                measuredWords.length - 1
            ) *
            spaceWidth;

        // ====================================================
        // LINE START X
        // ====================================================

        let lineStartX =
            x;

        if (
            align === "center"
        ) {

            lineStartX =
                x -
                totalWidth / 2;

        }
        else if (
            align === "right"
        ) {

            lineStartX =
                x -
                totalWidth;
        }

        // ====================================================
        // ASS ALIGNMENT
        // ====================================================

        let assAlignment = 5;

        if (
            align === "left"
        ) {

            assAlignment = 4;

        }
        else if (
            align === "right"
        ) {

            assAlignment = 6;
        }

        // ====================================================
        // NORMAL TEXT
        // ====================================================

        const normalText =
            words
                .map(
                    (word: any) =>
                        escapeASS(
                            getText(word)
                        )
                )
                .join(" ");

        // ====================================================
        // NORMAL OVERRIDE
        // ====================================================

        const normalOverride =
            `{` +
            `\\fn${fontFamily}` +
            `\\fs${exportFontSize}` +
            `\\1c${normalColor}` +
            `\\3c${outlineColorASS}` +
            `\\bord${exportOutline}` +
            `\\shad${shadowValue}` +
            `\\an${assAlignment}` +
            `\\pos(${x.toFixed(2)},${y.toFixed(2)})` +
            `}`;

        // ====================================================
        // NORMAL EVENT
        // ====================================================

        events.push(
            [
                "Dialogue: 0",
                assTime(start),
                assTime(end),
                "Karaoke",
                "",
                "0",
                "0",
                "0",
                "",
                `${normalOverride}${normalText}`,
            ].join(",")
        );

        // ====================================================
        // ACTIVE WORDS
        // ====================================================

        let currentX =
            lineStartX;

        for (
            const item of measuredWords
        ) {

            const word =
                item.word;

            const wordStart =
                Number(
                    word.start
                );

            const wordEnd =
                Number(
                    word.end
                );

            if (
                !Number.isFinite(wordStart) ||
                !Number.isFinite(wordEnd) ||
                wordEnd <= wordStart
            ) {

                currentX +=
                    item.width +
                    spaceWidth;

                continue;
            }

            const clipLeft =
                currentX;

            const clipRight =
                currentX +
                item.width;

            const wordDuration =
                wordEnd -
                wordStart;

            // =================================================
            // 20 FPS ACTIVE COLOR
            // =================================================

            const STEP =
                1 / 20;

            let currentTime =
                wordStart;

            while (
                currentTime < wordEnd
            ) {

                const nextTime =
                    Math.min(
                        wordEnd,
                        currentTime + STEP
                    );

                const percent =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            (
                                nextTime -
                                wordStart
                            ) /
                            wordDuration
                        )
                    );

                const currentClipRight =
                    clipLeft +
                    (
                        clipRight -
                        clipLeft
                    ) *
                    percent;

                // =================================================
                // ACTIVE OVERRIDE
                // =================================================

                const activeOverride =
                    `{` +
                    `\\fn${fontFamily}` +
                    `\\fs${exportFontSize}` +
                    `\\1c${activeColorASS}` +
                    `\\3c${outlineColorASS}` +
                    `\\bord${exportOutline}` +
                    `\\shad${shadowValue}` +
                    `\\an${assAlignment}` +
                    `\\pos(${x.toFixed(2)},${y.toFixed(2)})` +
                    `\\clip(` +
                    `${clipLeft.toFixed(2)},` +
                    `0,` +
                    `${currentClipRight.toFixed(2)},` +
                    `${EXPORT_HEIGHT}` +
                    `)` +
                    `}`;

                events.push(
                    [
                        "Dialogue: 1",
                        assTime(currentTime),
                        assTime(nextTime),
                        "Karaoke",
                        "",
                        "0",
                        "0",
                        "0",
                        "",
                        `${activeOverride}${escapeASS(
                            item.text
                        )}`,
                    ].join(",")
                );

                currentTime =
                    nextTime;
            }

            currentX +=
                item.width +
                spaceWidth;
        }
    }

    return (
        header +
        "\n" +
        events.join("\n") +
        "\n"
    );
}

// ============================================================
// LOAD FFMPEG
// ============================================================

export async function loadFFmpeg(
    onProgress?: (
        progress: number
    ) => void
) {

    if (loaded) {

        console.log(
            "[FFMPEG] Already loaded."
        );

        return;
    }

    console.log(
        "[FFMPEG] ===== LOAD START ====="
    );

    // IMPORTANT:
    // Phải là URL thật, không phải Markdown.
    const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

    // ========================================================
    // EVENTS
    // ========================================================

    ffmpeg.on(
        "progress",
        ({ progress }) => {

            const percent =
                Math.round(
                    Math.max(
                        0,
                        Math.min(
                            1,
                            progress
                        ) *
                        100
                    )
                );

            console.log(
                "[FFMPEG] Progress:",
                percent
            );

            onProgress?.(
                percent
            );
        }
    );

    ffmpeg.on(
        "log",
        ({ message }) => {

            console.log(
                "[FFMPEG]",
                message
            );
        }
    );

    // ========================================================
    // CORE JS
    // ========================================================

    console.log(
        "[FFMPEG] Fetching core JS..."
    );

    const coreURL =
        await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
        );

    console.log(
        "[FFMPEG] Core JS ready."
    );

    // ========================================================
    // WASM
    // ========================================================

    console.log(
        "[FFMPEG] Fetching WASM..."
    );

    const wasmURL =
        await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
        );

    console.log(
        "[FFMPEG] WASM ready."
    );

    // ========================================================
    // LOAD
    // ========================================================

    console.log(
        "[FFMPEG] Calling ffmpeg.load()..."
    );

    await ffmpeg.load({
        coreURL,
        wasmURL,
    });

    console.log(
        "[FFMPEG] ffmpeg.load() completed."
    );

    loaded = true;

    console.log(
        "[FFMPEG] ===== LOAD SUCCESS ====="
    );
}

// ============================================================
// EXPORT VIDEO
// ============================================================

export async function exportVideo(
    videoFile: string,
    lyrics: any,
    onProgress?: (
        progress: number
    ) => void
): Promise<Blob> {

    console.log(
        "[FFMPEG] Preparing karaoke export..."
    );

    // ========================================================
    // NORMALIZE LYRICS
    // ========================================================

    const safeLyrics =
        normalizeLyrics(
            lyrics
        );

    console.log(
        "[FFMPEG] Lyrics:",
        safeLyrics
    );

    console.log(
        "[FFMPEG] Lyrics count:",
        safeLyrics.length
    );

    if (
        safeLyrics.length === 0
    ) {

        throw new Error(
            "Không có lyrics hợp lệ để export."
        );
    }

    // ========================================================
    // LOAD FFMPEG
    // ========================================================

    await loadFFmpeg(
        onProgress
    );

    // ========================================================
    // INPUT VIDEO
    // ========================================================

    console.log(
        "[FFMPEG] Fetching input video..."
    );

    if (!videoFile) {

        throw new Error(
            "Không có video đầu vào."
        );
    }

    const inputData =
        await fetchFile(
            videoFile
        );

    console.log(
        "[FFMPEG] Input size:",
        inputData.byteLength,
        "bytes"
    );

    await ffmpeg.writeFile(
        "input.mp4",
        inputData
    );

    console.log(
        "[FFMPEG] Input video written."
    );

    // ========================================================
    // BUILD ASS
    // ========================================================

    console.log(
        "[FFMPEG] Building karaoke ASS..."
    );

    const assContent =
        buildASS(
            safeLyrics
        );

    console.log(
        "[FFMPEG] ASS length:",
        assContent.length
    );

    // DEBUG
    console.log(
        "[FFMPEG] ===== ASS CONTENT ====="
    );

    console.log(
        assContent
    );

    console.log(
        "[FFMPEG] ===== END ASS ====="
    );

    const assData =
        new TextEncoder().encode(
            assContent
        );

    await ffmpeg.writeFile(
        "karaoke.ass",
        assData
    );

    console.log(
        "[FFMPEG] ASS subtitle written."
    );

    // ========================================================
    // REMOVE OLD OUTPUT
    // ========================================================

    try {

        await ffmpeg.deleteFile(
            "output.mp4"
        );

    }
    catch {
        // output chưa tồn tại
    }

    // ========================================================
    // EXPORT
    // ========================================================

    console.log(
        "[FFMPEG] ===== EXPORT START ====="
    );

    await ffmpeg.exec([
        "-i",
        "input.mp4",

        "-vf",
        `subtitles=karaoke.ass,scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:force_original_aspect_ratio=decrease,pad=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,

        "-r",
        "30",

        "-c:v",
        "libx264",

        "-preset",
        "ultrafast",

        "-pix_fmt",
        "yuv420p",

        "-c:a",
        "aac",

        "-b:a",
        "192k",

        "-movflags",
        "+faststart",

        "output.mp4",
    ]);

    console.log(
        "[FFMPEG] ===== EXPORT COMPLETE ====="
    );

    // ========================================================
    // READ OUTPUT
    // ========================================================

    const outputData =
        await ffmpeg.readFile(
            "output.mp4"
        );

    if (
        typeof outputData === "string"
    ) {

        throw new Error(
            "FFmpeg output không hợp lệ."
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
                type: "video/mp4",
            }
        );

    console.log(
        "[FFMPEG] Output size:",
        outputBlob.size,
        "bytes"
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    try {
        await ffmpeg.deleteFile(
            "input.mp4"
        );
    }
    catch {}

    try {
        await ffmpeg.deleteFile(
            "karaoke.ass"
        );
    }
    catch {}

    try {
        await ffmpeg.deleteFile(
            "output.mp4"
        );
    }
    catch {}

    return outputBlob;
}