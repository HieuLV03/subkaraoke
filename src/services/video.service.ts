// ============================================================
// IMPORT VIDEO - WEB
// ============================================================

export async function importVideo(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "video/*";

    input.onchange = () => {
      const file = input.files?.[0];

      resolve(file);
    };

    input.click();
  });
}


// ============================================================
// EXTRACT AUDIO - WEB
// ============================================================

export async function extractAudioFromVideo(
  videoFile: File
): Promise<{
  audioFile?: File;
  error?: string;
}> {
  try {
    // Web sẽ xử lý việc tách audio bằng FFmpeg.wasm
    // ở bước export / processing sau.
    //
    // Hiện tại chưa cần Electron IPC.

    return {
      error: "Audio extraction chưa được triển khai trên Web.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Không thể xử lý video.",
    };
  }
}