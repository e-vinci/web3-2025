/**
 * An export, as the backend sends it.
 *
 * Same convention as `Expense` and `User` next door: one type, named after the
 * thing, used by every component that touches it.
 */
export type ExportStatus = "queued" | "running" | "completed" | "failed";

export interface Export {
  id: number;
  requesterId: number;
  status: ExportStatus;
  rowCount?: number;
  failedReason?: string;
  createdAt: string;
}

/** What the worker reports while it is running. */
export interface ExportProgress {
  step: string;
  percent: number;
}
