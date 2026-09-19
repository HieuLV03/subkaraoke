export interface AIJob {
  task: string;

  status: "waiting" | "running" | "completed" | "failed";

  progress: number;

  message: string;
}