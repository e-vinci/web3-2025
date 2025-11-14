import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { pdfQueue } from "@/queues/pdfQueue";

// Create Express adapter
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Create Bull Board
createBullBoard({
  queues: [
    new BullMQAdapter(pdfQueue),
    // Add more queues here as needed
  ],
  serverAdapter,
});
