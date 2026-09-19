import { useState } from "react";

import { generateLyrics } from "@/services/ai.service";

import { useProjectStore } from "@/stores/project.store";

export default function GenerateLyricsButton() {
  const [loading, setLoading] = useState(false);

  const project = useProjectStore(
    (state) => state.project
  );

  const handleGenerate = async () => {
    if (!project?.audioFile) {
      alert("Vui lòng import bài hát trước.");
      return;
    }

    try {
      setLoading(true);

      const lyrics = await generateLyrics({
        audioFile: project.audioFile,
      });

      console.log("Lyrics:", lyrics);

      alert("AI tạo lời thành công!");
    } catch (error) {
      console.error(error);

      alert("Không thể tạo lời.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="card"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading
        ? "Đang tạo lời..."
        : "🤖 Generate Lyrics"}
    </button>
  );
}