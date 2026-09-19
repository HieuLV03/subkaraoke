export const ipc = {
  invoke<T = unknown>(
    channel: string,
    data?: unknown
  ): Promise<T> {
    return window.electronAPI.invoke<T>(
      channel,
      data
    );
  },

  send(
    channel: string,
    data?: unknown
  ): void {
    window.electronAPI.send(
      channel,
      data
    );
  },

  on<T = unknown>(
    channel: string,
    callback: (data: T) => void
  ) {
    return window.electronAPI.on<T>(
      channel,
      callback
    );
  },
};