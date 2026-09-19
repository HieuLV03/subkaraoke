import { ipc } from "./ipc.service";

export async function renderVideo(data: unknown) {

  return ipc.invoke(
    "ffmpeg:render",
    data
  );

}