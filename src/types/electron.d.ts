export {};

declare global {
  interface Window {
    electronAPI: {
      invoke<T = unknown>(
        channel: string,
        data?: unknown
      ): Promise<T>;

      send(
        channel: string,
        data?: unknown
      ): void;

      on<T = unknown>(
        channel: string,
        callback: (data: T) => void
      ): () => void;
    };
  }
}