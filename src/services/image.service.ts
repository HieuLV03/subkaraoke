
import { ipc } from "./ipc.service";

// ============================================================
// IMPORT IMAGE
// ============================================================

export async function importImage() {
  return ipc.invoke<string | undefined>(
    "dialog:importImage"
  );
}
