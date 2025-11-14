import SchemaBuilder from "../../graphql/builder";
import { queuePdfGeneration } from "@/queues/pdfQueue";
import { getJobStatus } from "./reportRepository";
import { requireAuth } from "@/graphql/authHelpers";
import { nanoid } from "nanoid";

const augmentSchema = (builder: typeof SchemaBuilder) => {
  // Job Status enum
  const JobStatusEnum = builder.enumType("JobStatus", {
    values: ["waiting", "active", "completed", "failed", "delayed"] as const,
  });

  // Report Job Result type
  const ReportJobRef = builder.objectRef<{
    reportId: string;
    status: "waiting" | "active" | "completed" | "failed" | "delayed";
    progress: number | null;
    failedReason?: string | null;
    createdAt: Date;
    result?: { filePath: string } | null;
  }>("ReportJob");

  builder.objectType(ReportJobRef, {
    fields: (t) => ({
      reportId: t.exposeString("reportId"),
      status: t.expose("status", { type: JobStatusEnum }),
      progress: t.exposeInt("progress", { nullable: true }),
      failedReason: t.exposeString("failedReason", { nullable: true }),
      createdAt: t.string({
        resolve: (parent) => parent.createdAt.toISOString(),
      }),
      downloadUrl: t.string({
        nullable: true,
        resolve: (parent) => {
          if (parent.status === "completed" && parent.result) {
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
              "Invalid startDate format. Use YYYY-MM-DD or ISO 8601 format."
            );
          }
          if (endDate && isNaN(endDate.getTime())) {
            throw new Error(
              "Invalid endDate format. Use YYYY-MM-DD or ISO 8601 format."
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
            status: "waiting" as const,
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
