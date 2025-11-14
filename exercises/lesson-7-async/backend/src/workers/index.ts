// Load environment variables using existing config
import "@/common/utils/envConfig";

import { pdfWorker } from "./pdfWorker";

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing workers...");
  await pdfWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing workers...");
  await pdfWorker.close();
  process.exit(0);
});
