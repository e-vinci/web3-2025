---
title: 'Lesson 7 – Async Processing & Pub/Sub'
description: 'Learn how to implement background jobs with BullMQ and real-time updates with Socket.io in your expense-sharing application.'
publishDate: 2025-11-07T00:00:00Z
excerpt: 'Master asynchronous processing patterns including job queues for PDF generation and WebSocket-based real-time notifications.'
tags:
- async
- bullmq
- socket-io
- websocket
- redis
- pub-sub
- real-time
- background-jobs
- typescript
- course
- web3-2025

category: 'course-lesson'
---
## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-7-theory.pptx)


## Introduction

In previous lessons, we built a secure expense-sharing application with authentication and authorization. However, **all operations happen synchronously** - when a user performs an action, they wait for the entire operation to complete. What if we want to:

- **Generate PDF expense reports** without blocking the API response?
- **Notify all users in real-time** when an expense is created?
- **Process time-consuming operations** in the background?

In this lesson, you'll learn:
- **Background job processing** with BullMQ and Redis
- **Real-time updates** using Socket.io and WebSocket
- **Job monitoring** with Bull Board
- **Event-driven architecture** patterns

By the end, your app will generate PDF reports asynchronously and push real-time updates to all connected clients.

---

## Recommended Reading

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [PDFKit Guide](https://pdfkit.org/docs/getting_started.html)
- [Redis Quick Start](https://redis.io/docs/getting-started/)
- [Bull Board GitHub](https://github.com/felixmosh/bull-board)
- [WebSocket vs HTTP Polling](https://ably.com/topic/websockets-vs-polling)

---

## Exercises

> **Starting Point:** These exercises build upon the code from Lesson 6. You should have a secure Express backend with GraphQL and authentication. If you haven't completed Lesson 6, you can use the code in `exercises/lesson-7-async/` as your starting point.

> **Implementation Note:** This lesson uses a simplified approach for GraphQL date handling by using string arguments instead of DateTime scalars. This avoids the need to install additional packages like `graphql-scalars` while keeping the implementation clean and straightforward. Additionally, we handle Date objects flexibly since BullMQ serializes them to strings when storing jobs in Redis, requiring robust type handling throughout the pipeline.

### 1. Set Up Redis and BullMQ

**Goal:** Install Redis and configure BullMQ for job queue management.

**Steps:**

1. **Install Redis locally:**

   **Windows (using WSL or Docker recommended):**
   ```bash
   # Using Docker
   docker run -d --name redis -p 6379:6379 redis:alpine

   # Or using WSL
   sudo apt-get update
   sudo apt-get install redis-server
   redis-server
   ```

   Alternartive: Memurai 
   
   -  a Redis compatible software built for windows
   - https://www.memurai.com/

   Just be careful that the cli is ´memurai-cli´, not ´redis-cli´

   **macOS:**
   ```bash
   brew install redis
   brew services start redis
   ```

   **Linux:**
   ```bash
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Verify Redis is running:**
   ```bash
   redis-cli ping # or memurai-cli ping
   # Should return: PONG
   ```

3. **Install BullMQ packages:**
   ```bash
   npm install bullmq ioredis
   npm install --save-dev @types/ioredis
   ```

4. **Create Redis connection configuration** in `src/config/redis.ts`:
   ```ts
   import { ConnectionOptions } from 'bullmq';

   export const redisConnection: ConnectionOptions = {
     host: process.env.REDIS_HOST || 'localhost',
     port: parseInt(process.env.REDIS_PORT || '6379'),
     password: process.env.REDIS_PASSWORD,
     // For production:
     maxRetriesPerRequest: null,
     enableReadyCheck: false,
   };
   ```

5. **Add Redis config to `.env`:**
   ```dotenv
   REDIS_HOST=localhost
   REDIS_PORT=6379
   # REDIS_PASSWORD=your-password (if using auth)
   ```

6. **Test connection** by creating `src/config/testRedis.ts`:
   ```ts
   import { Queue } from 'bullmq';
   import { redisConnection } from './redis';

   async function testRedis() {
     const testQueue = new Queue('test', { connection: redisConnection });

     try {
       await testQueue.add('test-job', { message: 'Hello Redis!' });
       console.log('✅ Redis connection successful!');

       const jobs = await testQueue.getJobs(['waiting']);
       console.log(`Jobs in queue: ${jobs.length}`);

       await testQueue.obliterate({ force: true });
       console.log('✅ Test queue cleaned up');
     } catch (error) {
       console.error('❌ Redis connection failed:', error);
     } finally {
       await testQueue.close();
     }
   }

   testRedis();
   ```

7. **Run the test:**
   ```bash
   npx tsx src/config/testRedis.ts
   ```

   You should see success messages confirming Redis is working.

---

### 2. Create PDF Generation Queue and Worker

**Goal:** Set up a job queue for generating expense report PDFs in the background.

**Steps:**

1. **Install PDF generation libraries:**
   ```bash
   npm install pdfkit
   npm install --save-dev @types/pdfkit
   ```

2. **Create job types** in `src/types/JobTypes.ts`:
   ```ts
   export interface GeneratePdfJobData {
     userId: number;
     startDate?: Date | string; // Support both Date and string (BullMQ serialization)
     endDate?: Date | string;
     reportId: string; // Unique ID for this report
   }

   export interface PdfJobResult {
     reportId: string;
     filePath: string;
     generatedAt: Date;
   }
   ```

3. **Create the PDF queue** in `src/queues/pdfQueue.ts`:
   ```ts
   import { Queue } from 'bullmq';
   import { redisConnection } from '@/config/redis';
   import type { GeneratePdfJobData, PdfJobResult } from '@/types/JobTypes';

   export const PDF_QUEUE_NAME = 'pdf-generation';

   export const pdfQueue = new Queue<GeneratePdfJobData, PdfJobResult>(
     PDF_QUEUE_NAME,
     {
       connection: redisConnection,
       defaultJobOptions: {
         attempts: 3,
         backoff: {
           type: 'exponential',
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
     const job = await pdfQueue.add('generate-expense-report', data, {
       jobId: data.reportId, // Use reportId as job ID for idempotency
     });

     console.log(`📋 PDF generation job queued: ${job.id}`);
     return job;
   }
   ```

4. **Create PDF generator service** in `src/services/pdfGenerator.ts`:
   ```ts
   import PDFDocument from 'pdfkit';
   import fs from 'fs';
   import path from 'path';
   import { PrismaClient } from '../generated/prisma';

   const prisma = new PrismaClient();

   export interface ExpenseReportData {
     userId: number;
     startDate?: Date | string;
     endDate?: Date | string;
   }

   export async function generateExpenseReport(data: ExpenseReportData): Promise<string> {
     // Convert string dates to Date objects if needed (BullMQ serializes Date objects to strings)
     const startDate = data.startDate instanceof Date 
       ? data.startDate 
       : data.startDate 
       ? new Date(data.startDate) 
       : undefined;
     const endDate = data.endDate instanceof Date 
       ? data.endDate 
       : data.endDate 
       ? new Date(data.endDate) 
       : undefined;
     // Fetch user and expenses
     const user = await prisma.user.findUniqueOrThrow({
       where: { id: data.userId },
     });

     const expenses = await prisma.expense.findMany({
       where: {
         OR: [
           { payerId: data.userId },
           { participants: { some: { id: data.userId } } },
         ],
         ...(startDate && { date: { gte: startDate } }),
         ...(endDate && { date: { lte: endDate } }),
       },
       include: {
         payer: true,
         participants: true,
       },
       orderBy: { date: 'desc' },
     });

     // Create reports directory if it doesn't exist
     const reportsDir = path.join(process.cwd(), 'reports');
     if (!fs.existsSync(reportsDir)) {
       fs.mkdirSync(reportsDir, { recursive: true });
     }

     // Generate unique filename
     const filename = `expense-report-${user.id}-${Date.now()}.pdf`;
     const filePath = path.join(reportsDir, filename);

     // Create PDF
     return new Promise((resolve, reject) => {
       const doc = new PDFDocument({ margin: 50 });
       const stream = fs.createWriteStream(filePath);

       // Return just the filename (not full path) for static file serving
       stream.on('finish', () => resolve(filename));
       stream.on('error', reject);

       doc.pipe(stream);

       // Title
       doc
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('Expense Report', { align: 'center' });

       doc.moveDown();

       // User info
       doc
         .fontSize(12)
         .font('Helvetica')
         .text(`Generated for: ${user.name}`, { align: 'left' })
         .text(`Email: ${user.email}`)
         .text(`Generated on: ${new Date().toLocaleString()}`);

       doc.moveDown();

       // Date range (if specified)
       if (startDate || endDate) {
         // Helper function to handle Date|string formatting
         const formatDate = (date: Date | string | undefined) => {
           if (!date) return 'All';
           const dateObj = date instanceof Date ? date : new Date(date);
           return dateObj.toLocaleDateString();
         };

         doc.text(
           `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`
         );
         doc.moveDown();
       }

       // Expenses table header
       doc
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Expenses', { underline: true });

       doc.moveDown(0.5);

       if (expenses.length === 0) {
         doc.fontSize(12).font('Helvetica').text('No expenses found for this period.');
       } else {
         // Calculate totals
         let totalPaid = 0;
         let totalOwed = 0;

         expenses.forEach((expense) => {
           const isPayer = expense.payerId === data.userId;
           const isParticipant = expense.participants.some((p) => p.id === data.userId);
           const shareAmount = expense.amount / expense.participants.length;

           doc
             .fontSize(10)
             .font('Helvetica-Bold')
             .text(expense.description, { continued: true })
             .font('Helvetica')
             .text(` - ${expense.date.toLocaleDateString()}`);

           doc
             .fontSize(9)
             .text(`  Amount: €${expense.amount.toFixed(2)}`)
             .text(`  Paid by: ${expense.payer.name}`)
             .text(
               `  Participants: ${expense.participants.map((p) => p.name).join(', ')}`
             );

           if (isPayer) {
             doc.text(`  Your share: €${shareAmount.toFixed(2)} (you paid)`, {
               fillColor: 'green',
             });
             totalPaid += expense.amount;
           } else if (isParticipant) {
             doc.text(`  Your share: €${shareAmount.toFixed(2)} (you owe)`, {
               fillColor: 'red',
             });
             totalOwed += shareAmount;
           }

           doc.fillColor('black');
           doc.moveDown(0.5);
         });

         // Summary
         doc.moveDown();
         doc
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Summary', { underline: true });

         doc
           .fontSize(10)
           .font('Helvetica')
           .text(`Total expenses: ${expenses.length}`)
           .text(`Total you paid: €${totalPaid.toFixed(2)}`, { fillColor: 'green' })
           .fillColor('black')
           .text(`Total you owe: €${totalOwed.toFixed(2)}`, { fillColor: 'red' })
           .fillColor('black')
           .text(`Net balance: €${(totalPaid - totalOwed).toFixed(2)}`, {
             fillColor: totalPaid - totalOwed >= 0 ? 'green' : 'red',
           });
       }

       // Footer
       doc
         .fontSize(8)
         .fillColor('gray')
         .text(
           `Generated by Expense Sharing App - ${new Date().toISOString()}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );

       doc.end();
     });
   }
   ```

   **Note: Writing PDFs this way is probably a bad idea - it takes a huge amount of code for some lines of results. The usual alternative is to use some kind of template where we'll only add the variable part. Another one is to render HTML, then convert it to PDF.

5. **Create the worker** in `src/workers/pdfWorker.ts`:
   ```ts
   import { Worker, Job } from 'bullmq';
   import { redisConnection } from '@/config/redis';
   import { PDF_QUEUE_NAME } from '@/queues/pdfQueue';
   import { generateExpenseReport } from '@/services/pdfGenerator';
   import type { GeneratePdfJobData, PdfJobResult } from '@/types/JobTypes';

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
   pdfWorker.on('completed', (job) => {
     console.log(`✅ Job ${job.id} completed successfully`);
   });

   pdfWorker.on('failed', (job, err) => {
     console.error(`❌ Job ${job?.id} failed:`, err.message);
   });

   pdfWorker.on('error', (err) => {
     console.error('❌ Worker error:', err);
   });

   console.log('🚀 PDF Worker started');
   ```

6. **Create worker entry point** in `src/workers/index.ts`:
   ```ts
   // Load environment variables (important for worker processes!)
   import '@/common/utils/envConfig';
   
   import { pdfWorker } from './pdfWorker';

   // Graceful shutdown
   process.on('SIGTERM', async () => {
     console.log('SIGTERM received, closing workers...');
     await pdfWorker.close();
     process.exit(0);
   });

   process.on('SIGINT', async () => {
     console.log('SIGINT received, closing workers...');
     await pdfWorker.close();
     process.exit(0);
   });
   ```

7. **Add worker script to `package.json`:**
   ```json
   {
     "scripts": {
       "worker": "tsx src/workers/index.ts",
       "dev:worker": "tsx watch src/workers/index.ts"
     }
   }
   ```

   > **Note**: We now need to run two processes - one for the web server, one for the worker. This will impact our infrastructure too (how ?)

8. **Start the worker in a separate terminal:**
   ```bash
   npm run dev:worker
   ```

   You should see: `🚀 PDF Worker started`

---

### 3. Add Bull Board Monitoring Dashboard

**Goal:** Set up Bull Board to visualize and monitor job queues.

This is very important as we're getting a bit "blind" once we have background process - looking at the web app will np

**Steps:**

1. **Install Bull Board:**
   ```bash
   npm install @bull-board/express @bull-board/api
   ```

2. **Create Bull Board setup** in `src/config/bullBoard.ts`:
   ```ts
   import { createBullBoard } from '@bull-board/api';
   import { BullMQAdapter } from '@bull-board/bullmq';
   import { ExpressAdapter } from '@bull-board/express';
   import { pdfQueue } from '@/queues/pdfQueue';

   // Create Express adapter
   export const serverAdapter = new ExpressAdapter();
   serverAdapter.setBasePath('/admin/queues');

   // Create Bull Board
   createBullBoard({
     queues: [
       new BullMQAdapter(pdfQueue),
       // Add more queues here as needed
     ],
     serverAdapter,
   });
   ```

3. **Add Bull Board route to your server** in `src/server.ts`:
   ```ts
   import { serverAdapter } from './config/bullBoard';

   // ... existing middleware

   // Bull Board (only in development or with auth)
   if (process.env.NODE_ENV === 'development') {
     app.use('/admin/queues', serverAdapter.getRouter());
     console.log('📊 Bull Board available at http://localhost:3000/admin/queues');
   }
   ```

   > **Note:** In production, you should protect this route with authentication!

4. **Start your server and visit the dashboard:**
   ```
   http://localhost:3000/admin/queues
   ```

   You should see the Bull Board interface showing your `pdf-generation` queue.

5. **Test by adding a job manually** in the Bull Board UI or via code:
   ```ts
   // Test endpoint (add to server.ts temporarily)
   app.post('/test/pdf', async (req, res) => {
     const job = await queuePdfGeneration({
       userId: 1,
       reportId: `test-${Date.now()}`,
     });
     res.json({ message: 'Job queued', jobId: job.id });
   });
   ```

   Make the request and watch the job appear in Bull Board, then get processed by the worker!

---

### 4. Integrate PDF Generation with GraphQL

**Goal:** Add a GraphQL mutation to request PDF reports and a query to check job status.

**Steps:**

1. **Create job status repository** in `src/api/report/reportRepository.ts`:
   ```ts
   import { pdfQueue } from '@/queues/pdfQueue';

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
         state === 'waiting' ||
         state === 'delayed' ||
         state === 'active' ||
         state === 'completed' ||
         state === 'failed'
       ) {
         return state;
       }
       // For any other states (like "prioritized", etc.), map to "waiting"
       return 'waiting';
     })();

     return {
       reportId,
       status: mappedStatus as
         | 'waiting'
         | 'active'
         | 'completed'
         | 'failed'
         | 'delayed',
       progress: typeof progress === 'number' ? progress : null,
       result,
       failedReason: job.failedReason || null,
       createdAt: new Date(job.timestamp),
     };
   }
   ```

2. **Add GraphQL types and resolvers** in `src/api/report/augmentGraphqlSchema.ts`:

   > **Note:** We use string types for dates instead of DateTime scalars to avoid additional dependencies like `graphql-scalars`.

   ```ts
   import SchemaBuilder from '../../graphql/builder';
   import { queuePdfGeneration } from '@/queues/pdfQueue';
   import { getJobStatus } from './reportRepository';
   import { requireAuth } from '@/graphql/authHelpers';
   import { nanoid } from 'nanoid';

   const augmentSchema = (builder: typeof SchemaBuilder) => {
     // Job Status enum
     const JobStatusEnum = builder.enumType('JobStatus', {
       values: ['waiting', 'active', 'completed', 'failed', 'delayed'] as const,
     });

     // Report Job Result type - using objectRef for better type safety
     const ReportJobRef = builder.objectRef<{
       reportId: string;
       status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
       progress: number | null;
       failedReason?: string | null;
       createdAt: Date;
       result?: { filePath: string } | null;
     }>('ReportJob');

     builder.objectType(ReportJobRef, {
       fields: (t) => ({
         reportId: t.exposeString('reportId'),
         status: t.expose('status', { type: JobStatusEnum }),
         progress: t.exposeInt('progress', { nullable: true }),
         failedReason: t.exposeString('failedReason', { nullable: true }),
         // Convert Date to ISO string to avoid DateTime scalar dependency
         createdAt: t.string({
           resolve: (parent) => parent.createdAt.toISOString(),
         }),
         downloadUrl: t.string({
           nullable: true,
           resolve: (parent) => {
             if (parent.status === 'completed' && parent.result) {
               return `/reports/${parent.result.filePath}`;
             }
             return null;
           },
         }),
       }),
     });

     // Mutation to request PDF
     builder.mutationType({
       fields: (t) => ({
         requestExpenseReport: t.field({
           type: ReportJobRef,
           args: {
             // Use string args and parse them to avoid DateTime scalar
             startDate: t.arg.string({ required: false }),
             endDate: t.arg.string({ required: false }),
           },
           resolve: async (_parent, args, ctx) => {
             const user = requireAuth(ctx);

             // Generate unique report ID
             const reportId = `report-${user.userId}-${nanoid(10)}`;

             // Parse date strings to Date objects if provided
             const startDate = args.startDate
               ? new Date(args.startDate)
               : undefined;
             const endDate = args.endDate ? new Date(args.endDate) : undefined;

             // Validate dates if provided
             if (startDate && isNaN(startDate.getTime())) {
               throw new Error(
                 'Invalid startDate format. Use YYYY-MM-DD or ISO 8601 format.'
               );
             }
             if (endDate && isNaN(endDate.getTime())) {
               throw new Error(
                 'Invalid endDate format. Use YYYY-MM-DD or ISO 8601 format.'
               );
             }

             // Queue the job
             await queuePdfGeneration({
               userId: user.userId,
               startDate,
               endDate,
               reportId,
             });

             // Return initial job status
             return {
               reportId,
               status: 'waiting' as const,
               progress: 0,
               createdAt: new Date(),
             };
           },
         }),
       }),
     });

     // Query to check job status
     builder.queryType({
       fields: (t) => ({
         reportJobStatus: t.field({
           type: ReportJobRef,
           nullable: true,
           args: {
             reportId: t.arg.string({ required: true }),
           },
           resolve: async (_parent, args, ctx) => {
             requireAuth(ctx);
             return getJobStatus(args.reportId);
           },
         }),
       }),
     });
   };

   export default augmentSchema;
   ```

3. **Install nanoid for unique IDs:**
   ```bash
   npm install nanoid
   ```

4. **Register the schema augmentation** in `src/graphql/schema.ts`:
   ```ts
   import augmentReportSchema from '../api/report/augmentGraphqlSchema';

   // ...
   augmentReportSchema(builder);
   ```

5. **Add endpoint to serve PDF files** in `src/server.ts`:
   ```ts
   import express from 'express';
   import path from 'path';

   // Serve PDF reports (with auth check in production!)
   app.use('/reports', express.static(path.join(process.cwd(), 'reports')));
   ```

6. **Test with GraphQL:**
   ```graphql
   mutation RequestReport {
     requestExpenseReport(
       startDate: "2025-01-01"
       endDate: "2025-12-31"
     ) {
       reportId
       status
       progress
     }
   }

   # Then check status
   query CheckStatus {
     reportJobStatus(reportId: "report-1-abc123") {
       reportId
       status
       progress
       downloadUrl
     }
   }
   ```

   Watch the job in Bull Board as it processes!

---

### 5. Frontend Integration: PDF Generation UI

**Goal:** Add a UI to request PDF reports and download them when ready, following your existing codebase patterns.

**Steps:**


2. **Create the Reports component** in `src/pages/Reports/Component.tsx`:
   ```tsx
   import { useState, useEffect } from 'react';
   import { useLoaderData } from 'react-router';
   import { gql } from '@apollo/client';
   import { toast } from 'sonner';
   import { Download, FileText, Loader2 } from 'lucide-react';
   import graphqlClient from '@/lib/graphql-client';
   import type { LoaderData } from './loader';

   // GraphQL operations
   const REQUEST_EXPENSE_REPORT_GQL = gql`
     mutation RequestExpenseReport($startDate: String, $endDate: String) {
       requestExpenseReport(startDate: $startDate, endDate: $endDate) {
         reportId
         status
         progress
         createdAt
       }
     }
   `;

   const GET_REPORT_STATUS_GQL = gql`
     query GetReportStatus($reportId: String!) {
       reportJobStatus(reportId: $reportId) {
         reportId
         status
         progress
         downloadUrl
         createdAt
         failedReason
       }
     }
   `;

   interface ReportJob {
     reportId: string;
     status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
     progress: number | null;
     downloadUrl?: string;
     createdAt: string;
     failedReason?: string;
   }

   export default function Reports() {
     const {} = useLoaderData<LoaderData>();
     const [startDate, setStartDate] = useState('');
     const [endDate, setEndDate] = useState('');
     const [currentReportId, setCurrentReportId] = useState<string | null>(null);
     const [reportStatus, setReportStatus] = useState<ReportJob | null>(null);
     const [isRequesting, setIsRequesting] = useState(false);
     const [isPolling, setIsPolling] = useState(false);

     // Function to request a new PDF report
     const requestReport = async () => {
       setIsRequesting(true);
       try {
         const response = await graphqlClient.mutate({
           mutation: REQUEST_EXPENSE_REPORT_GQL,
           variables: {
             startDate: startDate || undefined,
             endDate: endDate || undefined,
           },
         });

         const reportData = response.data.requestExpenseReport;
         setCurrentReportId(reportData.reportId);
         setReportStatus(reportData);
         toast.success('PDF generation started!');
       } catch (error) {
         console.error('Failed to request report:', error);
         toast.error(`Failed to start PDF generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
       } finally {
         setIsRequesting(false);
       }
     };

     // Function to check report status
     const checkReportStatus = async (reportId: string) => {
       try {
         const response = await graphqlClient.query({
           query: GET_REPORT_STATUS_GQL,
           variables: { reportId },
           fetchPolicy: 'network-only', // Always fetch fresh data
         });

         const status = response.data.reportJobStatus;
         if (status) {
           setReportStatus(status);
           
           if (status.status === 'completed') {
             toast.success('PDF report ready for download!');
             setIsPolling(false);
           } else if (status.status === 'failed') {
             toast.error('PDF generation failed');
             setIsPolling(false);
           }
         }
       } catch (error) {
         console.error('Failed to check report status:', error);
         setIsPolling(false);
       }
     };

     // Polling effect
     useEffect(() => {
       let interval: NodeJS.Timeout;

       if (currentReportId && isPolling) {
         interval = setInterval(() => {
           checkReportStatus(currentReportId);
         }, 1000); // Poll every second
       }

       return () => {
         if (interval) {
           clearInterval(interval);
         }
       };
     }, [currentReportId, isPolling]);

     // Start polling when we have a report ID and it's not completed/failed
     useEffect(() => {
       if (currentReportId && reportStatus && 
           reportStatus.status !== 'completed' && 
           reportStatus.status !== 'failed') {
         setIsPolling(true);
       }
     }, [currentReportId, reportStatus]);

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       requestReport();
     };

     const handleDownload = () => {
       if (reportStatus?.downloadUrl) {
         const link = document.createElement('a');
         link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${reportStatus.downloadUrl}`;
         link.download = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
       }
     };

     const getStatusColor = (status: string) => {
       switch (status) {
         case 'completed': return 'text-green-600';
         case 'failed': return 'text-red-600';
         case 'active': return 'text-blue-600';
         default: return 'text-yellow-600';
       }
     };

     return (
       <section className="container mx-auto px-4 py-6">
         <div className="mb-6">
           <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
             <FileText className="h-6 w-6" />
             PDF Reports
           </h1>
           <p className="text-muted-foreground">
             Generate and download PDF expense reports
           </p>
         </div>

         <div className="max-w-2xl mx-auto space-y-6">
           {/* Report Generation Form */}
           <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
             <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
                     Start Date (optional)
                   </label>
                   <input
                     id="startDate"
                     type="date"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                   />
                 </div>
                 <div>
                   <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
                     End Date (optional)
                   </label>
                   <input
                     id="endDate"
                     type="date"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                     className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                   />
                 </div>
               </div>
               
               <button
                 type="submit"
                 disabled={isRequesting}
                 className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {isRequesting ? (
                   <>
                     <Loader2 className="h-4 w-4 animate-spin" />
                     Requesting Report...
                   </>
                 ) : (
                   'Generate PDF Report'
                 )}
               </button>
             </form>
           </div>

           {/* Report Status */}
           {reportStatus && (
             <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
               <h2 className="text-lg font-semibold mb-4">Report Status</h2>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-foreground">Report ID:</span>
                   <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                     {reportStatus.reportId}
                   </code>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <span className="text-foreground">Status:</span>
                   <span className={`capitalize font-medium ${getStatusColor(reportStatus.status)}`}>
                     {reportStatus.status}
                   </span>
                 </div>

                 {reportStatus.progress !== null && (
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-foreground">Progress:</span>
                       <span className="text-foreground">{reportStatus.progress}%</span>
                     </div>
                     <div className="w-full bg-muted rounded-full h-2">
                       <div
                         className="bg-primary h-2 rounded-full transition-all duration-300"
                         style={{ width: `${reportStatus.progress}%` }}
                       />
                     </div>
                   </div>
                 )}

                 {reportStatus.status === 'completed' && reportStatus.downloadUrl && (
                   <button
                     onClick={handleDownload}
                     className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 flex items-center justify-center gap-2"
                   >
                     <Download className="h-4 w-4" />
                     Download PDF Report
                   </button>
                 )}

                 {reportStatus.status === 'failed' && reportStatus.failedReason && (
                   <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                     <p className="text-destructive text-sm">
                       Report generation failed: {reportStatus.failedReason}
                     </p>
                   </div>
                 )}

                 <p className="text-sm text-muted-foreground">
                   Requested: {new Date(reportStatus.createdAt).toLocaleString()}
                 </p>
               </div>
             </div>
           )}
         </div>
       </section>
     );
   }
   ```

3. **Create the index file** in `src/pages/Reports/index.ts`:
   ```ts
   export { default } from './Component';
   ```

4. **Add a link to reports in your navigation** (e.g., in `src/components/Header.tsx`):
   ```tsx
   import { FileText } from 'lucide-react';
   import { Link } from 'react-router-dom';

   // Add this to your navigation
   <Link
     to="/reports"
     className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
   >
     <FileText className="h-4 w-4" />
     Reports
   </Link>
   ```

5. **Add the route to your router** (in `src/main.tsx` or your routing setup):
   ```tsx
   import Reports, { loader as reportsLoader } from './pages/Reports';

   // Add to your routes
   {
     path: '/reports',
     element: (
       <ProtectedRoute>
         <Layout>
           <Reports />
         </Layout>
       </ProtectedRoute>
     ),
     loader: reportsLoader,
   }
   ```

6. **Test the complete flow:**
   - Navigate to `/reports`
   - Select optional date range
   - Click "Generate PDF Report"
   - Watch the progress bar update in real-time
   - Download the completed PDF

   The UI will automatically poll for status updates and show progress until the PDF is ready!

---

### 6. Set Up Socket.io Server

**Goal:** Configure Socket.io for real-time WebSocket connections.

**Steps:**

1. **Install Socket.io:**
   ```bash
   npm install socket.io
   npm install --save-dev @types/socket.io
   ```

2. **Update your server to support Socket.io** in `src/server.ts`:

   You'll need to use `createServer` from `http` to share the server between Express and Socket.io:

   ```ts
   import express, { type Express } from 'express';
   import { createServer } from 'http';
   import { Server as SocketServer } from 'socket.io';

   const app: Express = express();
   const httpServer = createServer(app);

   // ... existing middleware setup

   // Initialize Socket.io
   const io = new SocketServer(httpServer, {
     cors: {
       origin: process.env.FRONTEND_URL || 'http://localhost:5173',
       credentials: true,
     },
   });

   // Socket.io connection handler
   io.on('connection', (socket) => {
     console.log(`🔌 Client connected: ${socket.id}`);

     socket.on('disconnect', (reason) => {
       console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
     });
   });

   // Start server
   const PORT = process.env.PORT || 3000;
   httpServer.listen(PORT, () => {
     console.log(`🚀 Server running on http://localhost:${PORT}`);
   });

   // Export io for use in other modules
   export { io };
   ```

3. **Add Socket.io authentication middleware** in `src/socket/authMiddleware.ts`:
   ```ts
   import { Socket } from 'socket.io';
   import { verifyToken } from '@/api/auth/authService';

   export interface AuthenticatedSocket extends Socket {
     user?: {
       userId: number;
       email: string;
     };
   }

   export function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
     const token = socket.handshake.auth.token;

     if (!token) {
       return next(new Error('Authentication required'));
     }

     try {
       const user = verifyToken(token);
       (socket as AuthenticatedSocket).user = user;
       next();
     } catch (error) {
       next(new Error('Invalid token'));
     }
   }
   ```

4. **Apply authentication middleware** in `src/server.ts`:
   ```ts
   import { authenticateSocket, type AuthenticatedSocket } from './socket/authMiddleware';

   // Apply authentication
   io.use(authenticateSocket);

   io.on('connection', (socket: AuthenticatedSocket) => {
     const userId = socket.user?.userId;
     console.log(`🔌 User ${userId} connected: ${socket.id}`);

     // Join user-specific room
     socket.join(`user-${userId}`);

     socket.on('disconnect', (reason) => {
       console.log(`🔌 User ${userId} disconnected: ${socket.id} (${reason})`);
     });
   });
   ```

5. **Test Socket.io with a simple HTML client** (create `test-socket.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Socket.io Test</title>
     <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
   </head>
   <body>
     <h1>Socket.io Test</h1>
     <div id="status">Disconnected</div>
     <script>
       // Replace with actual JWT token from login
       const token = 'YOUR_JWT_TOKEN_HERE';

       const socket = io('http://localhost:3000', {
         auth: { token }
       });

       socket.on('connect', () => {
         document.getElementById('status').textContent = 'Connected: ' + socket.id;
         console.log('Connected!');
       });

       socket.on('disconnect', () => {
         document.getElementById('status').textContent = 'Disconnected';
         console.log('Disconnected');
       });

       socket.on('connect_error', (error) => {
         console.error('Connection error:', error.message);
       });
     </script>
   </body>
   </html>
   ```

   Open this file in your browser and check the console to see if connection works!

---

### 7. Connect Socket.io Client in React

**Goal:** Integrate Socket.io client in your React application.

**Steps:**

1. **Install Socket.io client:**
   ```bash
   npm install socket.io-client
   ```

2. **Create Socket.io client wrapper** in `src/lib/socket-client.ts`:
   ```ts
   import { io, Socket } from 'socket.io-client';

   const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

   let socket: Socket | null = null;

   export function getSocket(): Socket | null {
     return socket;
   }

   export function connectSocket(token: string): Socket {
     if (socket?.connected) {
       return socket;
     }

     socket = io(SOCKET_URL, {
       auth: { token },
       autoConnect: true,
     });

     socket.on('connect', () => {
       console.log('🔌 Socket connected:', socket?.id);
     });

     socket.on('disconnect', (reason) => {
       console.log('🔌 Socket disconnected:', reason);
     });

     socket.on('connect_error', (error) => {
       console.error('🔌 Socket connection error:', error.message);
     });

     return socket;
   }

   export function disconnectSocket() {
     if (socket) {
       socket.disconnect();
       socket = null;
     }
   }
   ```

3. **Create Socket context** in `src/contexts/SocketContext.tsx`:
   ```tsx
   import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
   import { Socket } from 'socket.io-client';
   import { useAuth } from './AuthContext';
   import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket-client';

   interface SocketContextType {
     socket: Socket | null;
     isConnected: boolean;
   }

   const SocketContext = createContext<SocketContextType>({
     socket: null,
     isConnected: false,
   });

   export function SocketProvider({ children }: { children: ReactNode }) {
     const { token, isAuthenticated } = useAuth();
     const [socket, setSocket] = useState<Socket | null>(null);
     const [isConnected, setIsConnected] = useState(false);

     useEffect(() => {
       if (isAuthenticated && token) {
         // Connect socket
         const socketInstance = connectSocket(token);
         setSocket(socketInstance);

         const handleConnect = () => setIsConnected(true);
         const handleDisconnect = () => setIsConnected(false);

         socketInstance.on('connect', handleConnect);
         socketInstance.on('disconnect', handleDisconnect);

         // Set initial connection state
         setIsConnected(socketInstance.connected);

         return () => {
           socketInstance.off('connect', handleConnect);
           socketInstance.off('disconnect', handleDisconnect);
         };
       } else {
         // Disconnect if not authenticated
         disconnectSocket();
         setSocket(null);
         setIsConnected(false);
       }
     }, [isAuthenticated, token]);

     return (
       <SocketContext.Provider value={{ socket, isConnected }}>
         {children}
       </SocketContext.Provider>
     );
   }

   export function useSocket() {
     const context = useContext(SocketContext);
     if (!context) {
       throw new Error('useSocket must be used within SocketProvider');
     }
     return context;
   }
   ```

4. **Wrap your app with SocketProvider** in `src/App.tsx`:
   ```tsx
   import { SocketProvider } from './contexts/SocketContext';

   function App() {
     return (
       <ErrorBoundary>
         <AuthProvider>
           <SocketProvider>
             <ApolloProvider client={client}>
               <RouterProvider router={router} />
             </ApolloProvider>
           </SocketProvider>
         </AuthProvider>
       </ErrorBoundary>
     );
   }
   ```

5. **Add connection status indicator** in your navigation component:
   ```tsx
   import { useSocket } from '@/contexts/SocketContext';

   export function Navigation() {
     const { isConnected } = useSocket();

     return (
       <nav>
         {/* ... other nav items */}
         <div className="flex items-center gap-2">
           <span
             className={`w-2 h-2 rounded-full ${
               isConnected ? 'bg-green-500' : 'bg-red-500'
             }`}
           />
           <span className="text-sm">
             {isConnected ? 'Connected' : 'Disconnected'}
           </span>
         </div>
       </nav>
     );
   }
   ```

---

### 8. Broadcast Expense Creation Events

**Goal:** Emit WebSocket events when expenses are created or modified.

**Steps:**

1. **Create Socket.io event emitter helper** in `src/socket/events.ts`:
   ```ts
   import { io } from '@/server';

   export interface ExpenseCreatedEvent {
     expenseId: number;
     description: string;
     amount: number;
     payerId: number;
     payerName: string;
     participantIds: number[];
   }

   export interface ExpenseUpdatedEvent {
     expenseId: number;
     description: string;
     amount: number;
   }

   export interface ReportReadyEvent {
     reportId: string;
     userId: number;
     downloadUrl: string;
   }

   export function emitExpenseCreated(event: ExpenseCreatedEvent) {
     // Emit to all participants
     event.participantIds.forEach((participantId) => {
       io.to(`user-${participantId}`).emit('expense:created', event);
     });

     console.log(`📢 Expense created event sent to ${event.participantIds.length} users`);
   }

   export function emitExpenseUpdated(event: ExpenseUpdatedEvent, participantIds: number[]) {
     participantIds.forEach((participantId) => {
       io.to(`user-${participantId}`).emit('expense:updated', event);
     });

     console.log(`📢 Expense updated event sent to ${participantIds.length} users`);
   }

   export function emitReportReady(event: ReportReadyEvent) {
     io.to(`user-${event.userId}`).emit('report:ready', event);
     console.log(`📢 Report ready event sent to user ${event.userId}`);
   }
   ```

2. **Update expense creation mutation** in `src/api/expense/augmentGraphqlSchema.ts`:
   ```ts
   import { emitExpenseCreated } from '@/socket/events';

   // In createExpense resolver:
   resolve: async (_parent, args, ctx, _info) => {
     const user = requireAuth(ctx);

     if (user.userId !== args.payerId) {
       throw new GraphQLError('You can only create expenses that you paid for', {
         extensions: { code: 'FORBIDDEN' },
       });
     }

     const { description, amount, date, payerId, participantIds } = args;
     const expense = await expenseRepository.createExpense({
       description,
       amount,
       date,
       payerId,
       participantIds
     });

     // Emit real-time event to all participants
     emitExpenseCreated({
       expenseId: expense.id,
       description: expense.description,
       amount: expense.amount,
       payerId: expense.payer.id,
       payerName: expense.payer.name,
       participantIds: expense.participants.map(p => p.id),
     });

     return expense;
   }
   ```

3. **Update PDF worker to emit report ready event** in `src/workers/pdfWorker.ts`:
   ```ts
   import { emitReportReady } from '@/socket/events';

   pdfWorker.on('completed', (job) => {
     console.log(`✅ Job ${job.id} completed successfully`);

     // Emit report ready event
     if (job.returnvalue) {
       emitReportReady({
         reportId: job.returnvalue.reportId,
         userId: job.data.userId,
         downloadUrl: `/reports/${job.returnvalue.filePath}`,
       });
     }
   });
   ```

4. **Test by creating an expense:**
   - Open Bull Board in one tab
   - Open your app in two different browser windows (logged in as different users)
   - Create an expense that includes both users
   - Both users should receive the real-time notification!

---

### 9. Add Real-time Notifications UI

**Goal:** Display toast notifications when receiving real-time events.

**Steps:**

1. **Create event listener hook** in `src/hooks/useExpenseEvents.ts`:
   ```tsx
   import { useEffect } from 'react';
   import { useSocket } from '@/contexts/SocketContext';
   import { toast } from 'sonner';
   import type { ExpenseCreatedEvent, ReportReadyEvent } from '@/types/SocketEvents';

   export function useExpenseEvents() {
     const { socket, isConnected } = useSocket();

     useEffect(() => {
       if (!socket || !isConnected) return;

       // Handle expense created
       const handleExpenseCreated = (event: ExpenseCreatedEvent) => {
         console.log('📥 Expense created event:', event);

         toast.success(
           `New expense: ${event.description}`,
           {
             description: `€${event.amount.toFixed(2)} paid by ${event.payerName}`,
             duration: 5000,
           }
         );
       };

       // Handle report ready
       const handleReportReady = (event: ReportReadyEvent) => {
         console.log('📥 Report ready event:', event);

         toast.success(
           'Your expense report is ready!',
           {
             description: 'Click here to download',
             duration: 10000,
             action: {
               label: 'Download',
               onClick: () => {
                 window.open(event.downloadUrl, '_blank');
               },
             },
           }
         );
       };

       // Register listeners
       socket.on('expense:created', handleExpenseCreated);
       socket.on('report:ready', handleReportReady);

       // Cleanup
       return () => {
         socket.off('expense:created', handleExpenseCreated);
         socket.off('report:ready', handleReportReady);
       };
     }, [socket, isConnected]);
   }
   ```

2. **Create type definitions** in `src/types/SocketEvents.ts`:
   ```ts
   export interface ExpenseCreatedEvent {
     expenseId: number;
     description: string;
     amount: number;
     payerId: number;
     payerName: string;
     participantIds: number[];
   }

   export interface ExpenseUpdatedEvent {
     expenseId: number;
     description: string;
     amount: number;
   }

   export interface ReportReadyEvent {
     reportId: string;
     userId: number;
     downloadUrl: string;
   }
   ```

3. **Use the hook in your main layout** in `src/components/Layout.tsx`:
   ```tsx
   import { useExpenseEvents } from '@/hooks/useExpenseEvents';
   import { Outlet } from 'react-router';

   export default function Layout() {
     useExpenseEvents(); // Register event listeners

     return (
       <div>
         <Navigation />
         <main>
           <Outlet />
         </main>
       </div>
     );
   }
   ```

4. **Create a report request component** in `src/components/RequestReportButton.tsx`:
   ```tsx
   import { useState } from 'react';
   import { useMutation, gql } from '@apollo/client';
   import { toast } from 'sonner';

   const REQUEST_REPORT_MUTATION = gql`
     mutation RequestReport($startDate: DateTime, $endDate: DateTime) {
       requestExpenseReport(startDate: $startDate, endDate: $endDate) {
         reportId
         status
       }
     }
   `;

   export function RequestReportButton() {
     const [requestReport, { loading }] = useMutation(REQUEST_REPORT_MUTATION);

     const handleRequest = async () => {
       try {
         const { data } = await requestReport({
           variables: {
             // Optional: specify date range
             // startDate: new Date('2025-01-01'),
             // endDate: new Date('2025-12-31'),
           },
         });

         toast.success('Report generation started!', {
           description: `Report ID: ${data.requestExpenseReport.reportId}`,
         });
       } catch (error) {
         toast.error('Failed to request report');
         console.error(error);
       }
     };

     return (
       <button
         onClick={handleRequest}
         disabled={loading}
         className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
       >
         {loading ? 'Requesting...' : 'Generate PDF Report'}
       </button>
     );
   }
   ```

5. **Add the button to your expenses page:**
   ```tsx
   import { RequestReportButton } from '@/components/RequestReportButton';

   export default function ExpensesPage() {
     return (
       <div>
         <div className="flex justify-between items-center mb-4">
           <h1>Expenses</h1>
           <RequestReportButton />
         </div>
         {/* ... rest of your expenses UI */}
       </div>
     );
   }
   ```

6. **Test the complete flow:**
   - Click "Generate PDF Report"
   - Watch the job in Bull Board
   - Receive a toast notification when the PDF is ready
   - Click the notification to download the PDF!

---

### 10. (Bonus) Add Scheduled Jobs for Monthly Reports

**Goal:** Use BullMQ's repeatable jobs to automatically generate monthly expense summaries.

**Steps:**

1. **Create scheduled job definition** in `src/queues/scheduledJobs.ts`:
   ```ts
   import { Queue } from 'bullmq';
   import { redisConnection } from '@/config/redis';

   export const SCHEDULED_QUEUE_NAME = 'scheduled-jobs';

   export const scheduledQueue = new Queue(SCHEDULED_QUEUE_NAME, {
     connection: redisConnection,
   });

   // Add monthly report job (runs on 1st of each month at 9 AM)
   export async function scheduleMonthlyReports() {
     await scheduledQueue.add(
       'monthly-reports',
       { type: 'monthly-summary' },
       {
         repeat: {
           pattern: '0 9 1 * *', // Cron: minute hour day month weekday
         },
       }
     );

     console.log('📅 Monthly reports scheduled');
   }
   ```

2. **Create scheduled worker** in `src/workers/scheduledWorker.ts`:
   ```ts
   import { Worker, Job } from 'bullmq';
   import { redisConnection } from '@/config/redis';
   import { SCHEDULED_QUEUE_NAME } from '@/queues/scheduledJobs';
   import { PrismaClient } from '../generated/prisma';
   import { queuePdfGeneration } from '@/queues/pdfQueue';
   import { nanoid } from 'nanoid';

   const prisma = new PrismaClient();

   export const scheduledWorker = new Worker(
     SCHEDULED_QUEUE_NAME,
     async (job: Job) => {
       console.log(`📅 Processing scheduled job: ${job.name}`);

       if (job.name === 'monthly-reports') {
         // Get all active users
         const users = await prisma.user.findMany();

         const lastMonth = new Date();
         lastMonth.setMonth(lastMonth.getMonth() - 1);
         const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
         const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

         // Queue PDF generation for each user
         for (const user of users) {
           await queuePdfGeneration({
             userId: user.id,
             startDate,
             endDate,
             reportId: `monthly-${user.id}-${lastMonth.getFullYear()}-${lastMonth.getMonth()}-${nanoid(6)}`,
           });
         }

         console.log(`📊 Queued ${users.length} monthly reports`);
       }
     },
     {
       connection: redisConnection,
     }
   );

   console.log('🚀 Scheduled Worker started');
   ```

3. **Initialize scheduled jobs on server start** in `src/server.ts`:
   ```ts
   import { scheduleMonthlyReports } from './queues/scheduledJobs';

   // After server setup
   scheduleMonthlyReports().catch(console.error);
   ```

4. **Add scheduled worker to worker entry point** in `src/workers/index.ts`:
   ```ts
   import { pdfWorker } from './pdfWorker';
   import { scheduledWorker } from './scheduledWorker';

   // Graceful shutdown
   process.on('SIGTERM', async () => {
     console.log('SIGTERM received, closing workers...');
     await Promise.all([
       pdfWorker.close(),
       scheduledWorker.close(),
     ]);
     process.exit(0);
   });
   ```

5. **Test scheduled job manually:**

   Add a test endpoint to trigger the job immediately:
   ```ts
   app.post('/test/monthly-reports', async (req, res) => {
     await scheduledQueue.add('monthly-reports', { type: 'monthly-summary' });
     res.json({ message: 'Monthly reports job triggered' });
   });
   ```

   Call this endpoint and watch Bull Board to see the jobs being created!

---

## Summary

Congratulations! You've built a complete asynchronous, real-time expense-sharing application:

**What You've Built:**
- ✅ **Background Job Processing**: PDF generation with BullMQ
- ✅ **Job Monitoring**: Bull Board dashboard for queue visibility
- ✅ **Real-time Updates**: WebSocket notifications with Socket.io
- ✅ **Event-Driven Architecture**: Decoupled components communicating via events
- ✅ **Scheduled Jobs**: Automated monthly report generation
- ✅ **Error Handling**: Retries, dead letter queues, and graceful failures

**Key Concepts Learned:**
- Job queues and workers
- Redis as a message broker
- WebSocket vs HTTP for real-time communication
- Pub/Sub pattern
- Event-driven architecture
- Horizontal scaling with multiple workers
- Job scheduling with cron patterns

**Architecture Benefits:**
- Fast API response times (jobs run in background)
- Scalable (add more workers as needed)
- Resilient (automatic retries on failures)
- Real-time user experience
- Decoupled components
- Observable with Bull Board

### Next Steps

**Additional Features to Explore:**
- Priority queues (urgent vs normal jobs)
- Parent-child jobs (complex workflows)
- Job dependencies (job B waits for job A)
- Rate limiting (max N jobs per minute)
- Email notifications (Nodemailer + queue)
- Image processing (sharp + queue)
- Webhook processing
- CSV export jobs

**Production Considerations:**
- Redis clustering for high availability
- Multiple worker instances
- Monitoring and alerting (Prometheus, Grafana)
- Job data encryption
- Secure Bull Board behind authentication
- Graceful shutdown handling
- Log aggregation (ELK stack)

**Alternative Technologies:**
- RabbitMQ (more features than Redis)
- Apache Kafka (high-throughput event streaming)
- AWS SQS (managed queue service)
- Google Cloud Tasks
- Azure Service Bus

> ✅ Your expense-sharing app is now a real-time, async, production-ready application!
