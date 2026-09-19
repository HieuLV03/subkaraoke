import { ipc } from "@/services/ipc.service";

export default function AudioImporter() {
  const handleImport = async () => {
 const file = await ipc.invoke<string | null>(
    "dialog:importAudio"
);

    if (!file) return;

    console.log(file);
  };

  return (
    <button onClick={handleImport}>
      🎵 Import Son
    </button>
  );
}