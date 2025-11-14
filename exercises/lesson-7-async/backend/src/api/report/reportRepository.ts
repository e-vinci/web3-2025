import { pdfQueue } from "@/queues/pdfQueue";

export async function getJobStatus(reportId: string) {
  const job = await pdfQueue.getJob(reportId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const result = job.returnvalue;

  // Map BullMQ states to our GraphQL enum
  const mappedStatus = (() => {
    if (
      state === "waiting" ||
      state === "delayed" ||
      state === "active" ||
      state === "completed" ||
      state === "failed"
    ) {
      return state;
    }
    // For any other states (like "prioritized", etc.), map to "waiting"
    return "waiting";
  })();

  return {
    reportId,
    status: mappedStatus as
      | "waiting"
      | "active"
      | "completed"
      | "failed"
      | "delayed",
    progress: typeof progress === "number" ? progress : null,
    result,
    failedReason: job.failedReason || null,
    createdAt: new Date(job.timestamp),
  };
}
