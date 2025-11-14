import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis";
import type { GeneratePdfJobData, PdfJobResult } from "@/types/JobTypes";

export const PDF_QUEUE_NAME = "pdf-generation";

export const pdfQueue = new Queue<GeneratePdfJobData, PdfJobResult>(
  PDF_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  }
);

// Helper function to add PDF generation job
export async function queuePdfGeneration(data: GeneratePdfJobData) {
  const job = await pdfQueue.add("generate-expense-report", data, {
    jobId: data.reportId, // Use reportId as job ID for idempotency
  });

  console.log(`📋 PDF generation job queued: ${job.id}`);
  return job;
}
