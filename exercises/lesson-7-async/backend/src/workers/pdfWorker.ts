import { Worker, Job } from "bullmq";
import { redisConnection } from "@/config/redis";
import { PDF_QUEUE_NAME } from "@/queues/pdfQueue";
import { generateExpenseReport } from "@/services/pdfGenerator";
import type { GeneratePdfJobData, PdfJobResult } from "@/types/JobTypes";

export const pdfWorker = new Worker<GeneratePdfJobData, PdfJobResult>(
  PDF_QUEUE_NAME,
  async (job: Job<GeneratePdfJobData>) => {
    console.log(`📄 Processing PDF job ${job.id} for user ${job.data.userId}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // Generate PDF
      const filePath = await generateExpenseReport({
        userId: job.data.userId,
        startDate: job.data.startDate,
        endDate: job.data.endDate,
      });

      await job.updateProgress(90);

      console.log(`✅ PDF generated: ${filePath}`);

      await job.updateProgress(100);

      return {
        reportId: job.data.reportId,
        filePath,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ PDF generation failed for job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 PDFs at a time
  }
);

// Event handlers
pdfWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

pdfWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

pdfWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

console.log("🚀 PDF Worker started");
