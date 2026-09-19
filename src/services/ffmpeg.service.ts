import { FFmpeg } from "@ffmpeg/ffmpeg";
import {
    fetchFile,
    toBlobURL,
} from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

let loaded = false;

export async function loadFFmpeg(
    onProgress?: (progress: number) => void
) {
    if (loaded) {
        console.log("[FFMPEG] Already loaded.");
        return;
    }

    console.log("[FFMPEG] ===== LOAD START =====");

    // =========================================================
    // EVENTS
    // =========================================================

    ffmpeg.on(
        "progress",
        ({ progress }) => {
            const percent =
                Math.round(
                    Math.max(
                        0,
                        Math.min(1, progress)
                    ) * 100
                );

            console.log(
                "[FFMPEG] Progress:",
                percent
            );

            onProgress?.(percent);
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

    // =========================================================
    // FFmpeg CORE
    // =========================================================

    const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

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

    // =========================================================
    // WASM
    // =========================================================

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

    // =========================================================
    // LOAD
    // =========================================================

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


// =============================================================
// EXPORT VIDEO
// =============================================================

export async function exportVideo(
    videoFile: string,
    onProgress?: (
        progress: number
    ) => void
): Promise<Blob> {

    console.log(
        "[FFMPEG] Preparing input..."
    );

    await loadFFmpeg(
        onProgress
    );

    // =========================================================
    // INPUT
    // =========================================================

    console.log(
        "[FFMPEG] Fetching input video..."
    );

    const inputData =
        await fetchFile(
            videoFile
        );

    console.log(
        "[FFMPEG] Input size:",
        inputData.byteLength,
        "bytes"
    );

    // =========================================================
    // WRITE INPUT
    // =========================================================

    console.log(
        "[FFMPEG] Writing input.mp4..."
    );

    await ffmpeg.writeFile(
        "input.mp4",
        inputData
    );

    console.log(
        "[FFMPEG] Input written."
    );

    // =========================================================
    // EXPORT
    // =========================================================

    console.log(
        "[FFMPEG] Starting FFmpeg..."
    );

    await ffmpeg.exec([
        "-i",
        "input.mp4",

        "-vf",
        "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",

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
        "[FFMPEG] FFmpeg execution completed."
    );

    // =========================================================
    // READ OUTPUT
    // =========================================================

    console.log(
        "[FFMPEG] Reading output.mp4..."
    );

    const output =
        await ffmpeg.readFile(
            "output.mp4"
        );

    if (
        typeof output === "string"
    ) {
        throw new Error(
            "FFmpeg không tạo được file MP4."
        );
    }

    console.log(
        "[FFMPEG] Output size:",
        output.byteLength,
        "bytes"
    );

    // =========================================================
    // CREATE BLOB
    // =========================================================

    const outputData =
        new Uint8Array(
            output.byteLength
        );

    outputData.set(
        output
    );

    return new Blob(
        [outputData.buffer],
        {
            type: "video/mp4",
        }
    );
}