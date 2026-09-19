/// <reference types="vite/client" />

import type { IpcRenderer } from "electron";

declare global {
  interface Window {
    ipcRenderer: {
      on: IpcRenderer["on"];
      off: IpcRenderer["off"];
      send: IpcRenderer["send"];
      invoke: IpcRenderer["invoke"];
    };
  }
}

export {};