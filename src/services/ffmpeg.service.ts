import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ============================================================
// CONFIG
// ============================================================

const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 720;
const EXPORT_FPS = 30;

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
// FFMPEG INSTANCE
// ============================================================

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

// ============================================================
// NUMBER
// ============================================================

function numberOr(
    value: unknown,
    fallback: number
): number {
    const number = Number(value);

    if (Number.isFinite(number)) {
        return number;
    }

    return fallback;
}

// ============================================================
// ASS TIME
// ============================================================

function assTime(
    seconds: number
): string {
    const safeSeconds = Math.max(
        0,
        Number(seconds) || 0
    );

    const hours = Math.floor(
        safeSeconds / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
    );

    const secs = Math.floor(
        safeSeconds % 60
    );

    const centiseconds = Math.floor(
        (
            safeSeconds -
            Math.floor(safeSeconds)
        ) * 100
    );

    return (
        `${hours}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(secs).padStart(2, "0")}.` +
        `${String(centiseconds).padStart(2, "0")}`
    );
}

// ============================================================
// ASS COLOR
// ============================================================

function assColor(
    color: string
): string {
    if (
        !color ||
        typeof color !== "string"
    ) {
        return "&H00FFFFFF";
    }

    const hex = color
        .replace("#", "")
        .trim();

    if (
        !/^[0-9a-fA-F]{6}$/.test(hex)
    ) {
        return "&H00FFFFFF";
    }

    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);

    return (
        "&H00" +
        b +
        g +
        r
    ).toUpperCase();
}

// ============================================================
// ESCAPE ASS
// ============================================================

function escapeASS(
    text: string
): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}");
}

// ============================================================
// GET TEXT
// ============================================================

function getText(
    word: LyricWord
): string {
    const value =
        word.word ??
        word.text ??
        "";

    return String(value).trim();
}

// ============================================================
// MEASURE WORD
// ============================================================

function measureWord(
    text: string,
    fontFamily: string,
    fontSize: number
): number {
    try {
        const canvas =
            document.createElement("canvas");

        const context =
            canvas.getContext("2d");

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
    catch {
        return (
            text.length *
            fontSize *
            0.55
        );
    }
}

// ============================================================
// NORMALIZE LYRICS
// ============================================================

function normalizeLyrics(
    lyrics: LyricLine[]
): LyricLine[] {
    if (!Array.isArray(lyrics)) {
        return [];
    }

    return lyrics
        .map(
            (
                line: LyricLine
            ): LyricLine => {
                return {
                    ...line,
                    words:
                        Array.isArray(
                            line.words
                        )
                            ? line.words
                            : [],
                };
            }
        )
        .filter(
            (
                line: LyricLine
            ): boolean => {
                const words =
                    line.words ?? [];

                const text =
                    String(
                        line.text ?? ""
                    ).trim();

                return (
                    words.length > 0 ||
                    text.length > 0
                );
            }
        );
}

// ============================================================
// GET LINE TIMING
// ============================================================
//
// Nếu line.start/end hợp lệ -> dùng chúng.
//
// Nếu line.start/end chưa cập nhật nhưng
// word.start/end đã có -> tự lấy timing từ words.
//
// ============================================================

function getLineTiming(
    line: LyricLine
): {
    start: number;
    end: number;
} | null {
    const lineStart =
        Number(line.start);

    const lineEnd =
        Number(line.end);

    // --------------------------------------------------------
    // LINE TIMING
    // --------------------------------------------------------

    if (
        Number.isFinite(
            lineStart
        ) &&
        Number.isFinite(
            lineEnd
        ) &&
        lineEnd > lineStart
    ) {
        return {
            start: lineStart,
            end: lineEnd,
        };
    }

    // --------------------------------------------------------
    // WORD TIMING
    // --------------------------------------------------------

    const words =
        Array.isArray(
            line.words
        )
            ? line.words
            : [];

    const validWords =
        words.filter(
            (
                word: LyricWord
            ): boolean => {
                const start =
                    Number(word.start);

                const end =
                    Number(word.end);

                return (
                    Number.isFinite(
                        start
                    ) &&
                    Number.isFinite(
                        end
                    ) &&
                    end > start
                );
            }
        );

    if (
        validWords.length === 0
    ) {
        return null;
    }

    let start =
        Number.POSITIVE_INFINITY;

    let end =
        Number.NEGATIVE_INFINITY;

    for (
        let i = 0;
        i < validWords.length;
        i++
    ) {
        const word =
            validWords[i];

        const wordStart =
            Number(word.start);

        const wordEnd =
            Number(word.end);

        if (
            wordStart < start
        ) {
            start =
                wordStart;
        }

        if (
            wordEnd > end
        ) {
            end =
                wordEnd;
        }
    }

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
    ) {
        return null;
    }

    return {
        start,
        end,
    };
}

// ============================================================
// BUILD ASS
// ============================================================

function buildASS(
    lyrics: LyricLine[]
): string {
    const normalizedLyrics =
        normalizeLyrics(
            lyrics
        );

    const header =
        `[Script Info]
ScriptType: v4.00+
PlayResX: ${EXPORT_WIDTH}
PlayResY: ${EXPORT_HEIGHT}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,Arial,42,&H00FFFFFF,&H0000FF00,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,2,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events: string[] = [];

    for (
        let lineIndex = 0;
        lineIndex <
        normalizedLyrics.length;
        lineIndex++
    ) {
        const line =
            normalizedLyrics[
                lineIndex
            ];

        // ----------------------------------------------------
        // TIMING
        // ----------------------------------------------------

        const timing =
            getLineTiming(
                line
            );

        if (!timing) {
            console.warn(
                "[ASS] SKIP LINE - NO TIMING:",
                line.text
            );

            continue;
        }

        const lineStart =
            timing.start;

        const lineEnd =
            timing.end;

        // ----------------------------------------------------
        // STYLE
        // ----------------------------------------------------

        const style =
            line.style ?? {};

        const fontFamily =
            style.fontFamily ??
            "Arial";

        const fontSize =
            numberOr(
                style.fontSize,
                21
            );

        const normalColor =
            style.color ??
            "#ffffff";

        const activeColor =
            style.activeColor ??
            "#00ff66";

        const outlineColor =
            style.outline ??
            "#000000";

        const outlineWidth =
            numberOr(
                style.outlineWidth,
                2
            );

        const shadow =
            style.shadow ??
            true;

        const x =
            numberOr(
                style.x,
                330
            );

        const y =
            numberOr(
                style.y,
                180
            );

        const align =
            style.align ??
            "center";

        // ----------------------------------------------------
        // PREVIEW 640x360
        // EXPORT 1280x720
        // ----------------------------------------------------

        const exportX =
            x * 2;

        const exportY =
            y * 2;

        const exportFontSize =
            fontSize * 2;

        // ----------------------------------------------------
        // ASS ALIGNMENT
        // ----------------------------------------------------

        let alignment = 5;

        if (
            align === "left"
        ) {
            alignment = 4;
        }

        if (
            align === "right"
        ) {
            alignment = 6;
        }

        // ----------------------------------------------------
        // WORDS
        // ----------------------------------------------------

        const words =
            Array.isArray(
                line.words
            )
                ? line.words
                : [];

        const validWords =
            words.filter(
                (
                    word: LyricWord
                ): boolean => {
                    const text =
                        getText(
                            word
                        );

                    const start =
                        Number(
                            word.start
                        );

                    const end =
                        Number(
                            word.end
                        );

                    return (
                        text.length > 0 &&
                        Number.isFinite(
                            start
                        ) &&
                        Number.isFinite(
                            end
                        ) &&
                        end > start
                    );
                }
            );

        // ----------------------------------------------------
        // COMMON ASS TAG
        // ----------------------------------------------------

        const commonTag =
            `{\\fn${fontFamily}` +
            `\\fs${exportFontSize}` +
            `\\1c${assColor(
                normalColor
            )}` +
            `\\2c${assColor(
                activeColor
            )}` +
            `\\3c${assColor(
                outlineColor
            )}` +
            `\\bord${outlineWidth * 2}` +
            `\\shad${shadow ? 2 : 0}` +
            `\\an${alignment}` +
            `\\pos(${exportX},${exportY})}`;

        // ====================================================
        // WORD TIMING
        // ====================================================

        if (
            validWords.length > 0
        ) {
            console.log(
                "[ASS] LINE:",
                line.text
            );

            console.log(
                "[ASS] LINE TIMING:",
                lineStart,
                lineEnd
            );

            console.log(
                "[ASS] WORD COUNT:",
                validWords.length
            );

            const karaokeParts: string[] = [];

            for (
                let wordIndex = 0;
                wordIndex <
                validWords.length;
                wordIndex++
            ) {
                const word =
                    validWords[
                        wordIndex
                    ];

                const text =
                    getText(
                        word
                    );

                const wordStart =
                    Number(
                        word.start
                    );

                const wordEnd =
                    Number(
                        word.end
                    );

                const duration =
                    wordEnd -
                    wordStart;

                const centiseconds =
                    Math.max(
                        1,
                        Math.round(
                            duration * 100
                        )
                    );

                karaokeParts.push(
                    `{\\k${centiseconds}}` +
                    escapeASS(
                        text
                    )
                );
            }

            const karaokeText =
                karaokeParts.join(
                    " "
                );

            const eventText =
                commonTag +
                karaokeText;

            const dialogue =
                "Dialogue:" +
                "0," +
                assTime(lineStart) +
                "," +
                assTime(lineEnd) +
                "," +
                "Karaoke," +
                "," +
                "0,0,0,," +
                eventText;

            console.log(
                "[ASS] DIALOGUE:",
                dialogue
            );

            events.push(
                dialogue
            );

            continue;
        }

        // ====================================================
        // FALLBACK - LINE TEXT
        // ====================================================

        const fallbackText =
            String(
                line.text ?? ""
            ).trim();

        if (
            fallbackText.length === 0
        ) {
            continue;
        }

        const fallbackTextEscaped =
            escapeASS(
                fallbackText
            );

        const fallbackEvent =
            commonTag +
            fallbackTextEscaped;

        const dialogue =
            "Dialogue:" +
            "0," +
            assTime(lineStart) +
            "," +
            assTime(lineEnd) +
            "," +
            "Karaoke," +
            "," +
            "0,0,0,," +
            fallbackEvent;

        console.log(
            "[ASS] FALLBACK DIALOGUE:",
            dialogue
        );

        events.push(
            dialogue
        );
    }

    const ass =
        header +
        events.join("\n") +
        "\n";

    console.log(
        "[ASS] TOTAL DIALOGUE:",
        events.length
    );

    return ass;
}

// ============================================================
// LOG ASS
// ============================================================

function logASS(
    ass: string
): void {
    console.log(
        "========== ASS BEGIN =========="
    );

    console.log(
        ass
    );

    console.log(
        "========== ASS END =========="
    );
}

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
        "[FFMPEG] Loading FFmpeg..."
    );

    const instance =
        new FFmpeg();

    instance.on(
        "log",
        ({
            message,
        }) => {
            console.log(
                "[FFMPEG LOG]",
                message
            );
        }
    );

    instance.on(
        "progress",
        ({
            progress,
        }) => {
            console.log(
                "[FFMPEG PROGRESS]",
                Math.round(
                    progress * 100
                )
            );
        }
    );

    // --------------------------------------------------------
    // IMPORTANT:
    // KHÔNG CÓ MARKDOWN LINK Ở ĐÂY
    // --------------------------------------------------------

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
        "[FFMPEG] FFmpeg loaded successfully."
    );

    return instance;
}

// ============================================================
// DELETE FILE SAFE
// ============================================================

async function deleteFileSafe(
    engine: FFmpeg,
    filename: string
): Promise<void> {
    try {
        await engine.deleteFile(
            filename
        );
    }
    catch {
        // Ignore
    }
}

// ============================================================
// EXPORT VIDEO
// ============================================================

export async function exportVideo(
    videoFile: string | File,
    lyrics: LyricLine[],
    onProgress?: (
        progress: number
    ) => void
): Promise<Blob> {
    console.log(
        "[FFMPEG] Preparing karaoke export..."
    );

    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    if (!videoFile) {
        throw new Error(
            "Không có video để export."
        );
    }

    if (
        !Array.isArray(
            lyrics
        )
    ) {
        throw new Error(
            "Dữ liệu lyrics không hợp lệ."
        );
    }

    console.log(
        "[FFMPEG] Lyrics count:",
        lyrics.length
    );

    // --------------------------------------------------------
    // PRINT LYRICS
    // --------------------------------------------------------

    console.log(
        "[EXPORT LYRICS]",
        JSON.stringify(
            lyrics,
            null,
            2
        )
    );

    // --------------------------------------------------------
    // LOAD FFMPEG
    // --------------------------------------------------------

    const engine =
        await loadFFmpeg();

    onProgress?.(5);

    // --------------------------------------------------------
    // CLEAN
    // --------------------------------------------------------

    await deleteFileSafe(
        engine,
        "input.mp4"
    );

    await deleteFileSafe(
        engine,
        "karaoke.ass"
    );

    await deleteFileSafe(
        engine,
        "output.mp4"
    );

    // --------------------------------------------------------
    // WRITE VIDEO
    // --------------------------------------------------------

    console.log(
        "[FFMPEG] Reading input video..."
    );

    const inputData =
        await fetchFile(
            videoFile
        );

    console.log(
        "[FFMPEG] Input size:",
        inputData.length
    );

    await engine.writeFile(
        "input.mp4",
        inputData
    );

    onProgress?.(10);

    // --------------------------------------------------------
    // BUILD ASS
    // --------------------------------------------------------

    console.log(
        "[FFMPEG] Building ASS subtitles..."
    );

    const ass =
        buildASS(
            lyrics
        );

    logASS(
        ass
    );

    if (
        !ass.includes(
            "Dialogue:"
        )
    ) {
        console.warn(
            "[FFMPEG] WARNING: ASS has NO Dialogue."
        );
    }

    // --------------------------------------------------------
    // WRITE ASS
    // --------------------------------------------------------

    const assData =
        new TextEncoder().encode(
            ass
        );

    await engine.writeFile(
        "karaoke.ass",
        assData
    );

    console.log(
        "[FFMPEG] ASS written successfully."
    );

    onProgress?.(15);

    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    const videoFilter =
        [
            `scale=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:force_original_aspect_ratio=decrease`,
            `pad=${EXPORT_WIDTH}:${EXPORT_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
            "subtitles=karaoke.ass:charenc=UTF-8",
        ].join(",");

    console.log(
        "[FFMPEG] Video filter:",
        videoFilter
    );

    // --------------------------------------------------------
    // EXPORT
    // --------------------------------------------------------

    onProgress?.(20);

    console.log(
        "[FFMPEG] Starting render..."
    );

    await engine.exec(
        [
            "-i",
            "input.mp4",

            "-vf",
            videoFilter,

            "-r",
            String(
                EXPORT_FPS
            ),

            "-c:v",
            "libx264",

            "-preset",
            "ultrafast",

            "-crf",
            "23",

            "-pix_fmt",
            "yuv420p",

            "-c:a",
            "aac",

            "-b:a",
            "192k",

            "-movflags",
            "+faststart",

            "-y",

            "output.mp4",
        ]
    );

    onProgress?.(95);

    // --------------------------------------------------------
    // READ OUTPUT
    // --------------------------------------------------------

    console.log(
        "[FFMPEG] Reading output..."
    );

    const outputData =
        await engine.readFile(
            "output.mp4"
        );

    // --------------------------------------------------------
    // CHECK OUTPUT
    // --------------------------------------------------------

    if (
        typeof outputData ===
        "string"
    ) {
        throw new Error(
            "FFmpeg trả về output không hợp lệ."
        );
    }

    // --------------------------------------------------------
    // FIX TYPESCRIPT BLOB ERROR
    // --------------------------------------------------------

    const outputBytes =
        new Uint8Array(
            outputData
        );

    const outputBuffer =
        outputBytes.buffer;

    const outputBlob =
        new Blob(
            [
                outputBuffer,
            ],
            {
                type:
                    "video/mp4",
            }
        );

    console.log(
        "[FFMPEG] Output size:",
        outputBlob.size
    );

    onProgress?.(100);

    // --------------------------------------------------------
    // CLEAN
    // --------------------------------------------------------

    await deleteFileSafe(
        engine,
        "input.mp4"
    );

    await deleteFileSafe(
        engine,
        "karaoke.ass"
    );

    await deleteFileSafe(
        engine,
        "output.mp4"
    );

    console.log(
        "[FFMPEG] Export completed."
    );

    return outputBlob;
}