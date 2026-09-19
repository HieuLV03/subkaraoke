import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

let loaded = false;

export async function loadFFmpeg(
    onProgress?: (progress: number) => void
) {
    if (loaded) {
        return;
    }

    ffmpeg.on("progress", ({ progress }) => {
        if (onProgress) {
            onProgress(Math.round(progress * 100));
        }
    });

    const baseURL =
        "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

    await ffmpeg.load({
        coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript"
        ),
        wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm"
        ),
    });

    loaded = true;
}

export async function exportVideo(
    videoFile: string,
    onProgress?: (progress: number) => void
): Promise<Blob> {

    await loadFFmpeg(onProgress);

    const inputData =
        await fetchFile(videoFile);

    await ffmpeg.writeFile(
        "input.mp4",
        inputData
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

    const output =
        await ffmpeg.readFile(
            "output.mp4"
        );

    if (!(output instanceof Uint8Array)) {
        throw new Error(
            "Không đọc được file MP4 xuất ra."
        );
    }

    return new Blob(
        [output.buffer as ArrayBuffer],
        {
            type: "video/mp4",
        }
    );
}