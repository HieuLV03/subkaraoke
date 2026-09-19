import { ipc } from "./ipc.service";

export async function importAudio() {
  return ipc.invoke<string | undefined>(
    "dialog:importAudio"
  );
}