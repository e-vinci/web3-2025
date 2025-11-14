import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

export interface ExpenseReportData {
  userId: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

export async function generateExpenseReport(
  data: ExpenseReportData
): Promise<string> {
  // Convert string dates to Date objects if needed
  const startDate =
    data.startDate instanceof Date
      ? data.startDate
      : data.startDate
      ? new Date(data.startDate)
      : undefined;
  const endDate =
    data.endDate instanceof Date
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
    orderBy: { date: "desc" },
  });

  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), "reports");
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

    stream.on("finish", () => resolve(filename));
    stream.on("error", reject);

    doc.pipe(stream);

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Expense Report", { align: "center" });

    doc.moveDown();

    // User info
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated for: ${user.name}`, { align: "left" })
      .text(`Email: ${user.email}`)
      .text(`Generated on: ${new Date().toLocaleString()}`);

    doc.moveDown();

    // Date range (if specified)
    if (data.startDate || data.endDate) {
      const formatDate = (date: Date | string | undefined) => {
        if (!date) return "All";
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString();
      };

      doc.text(
        `Period: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`
      );
      doc.moveDown();
    }

    // Expenses table header
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Expenses", { underline: true });

    doc.moveDown(0.5);

    if (expenses.length === 0) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text("No expenses found for this period.");
    } else {
      // Calculate totals
      let totalPaid = 0;
      let totalOwed = 0;

      expenses.forEach((expense) => {
        const isPayer = expense.payerId === data.userId;
        const isParticipant = expense.participants.some(
          (p) => p.id === data.userId
        );
        const shareAmount = expense.amount / expense.participants.length;

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(expense.description, { continued: true })
          .font("Helvetica")
          .text(` - ${expense.date.toLocaleDateString()}`);

        doc
          .fontSize(9)
          .text(`  Amount: €${expense.amount.toFixed(2)}`)
          .text(`  Paid by: ${expense.payer.name}`)
          .text(
            `  Participants: ${expense.participants
              .map((p) => p.name)
              .join(", ")}`
          );

        if (isPayer) {
          doc.text(`  Your share: €${shareAmount.toFixed(2)} (you paid)`, {
            fillColor: "green",
          });
          totalPaid += expense.amount;
        } else if (isParticipant) {
          doc.text(`  Your share: €${shareAmount.toFixed(2)} (you owe)`, {
            fillColor: "red",
          });
          totalOwed += shareAmount;
        }

        doc.fillColor("black");
        doc.moveDown(0.5);
      });

      // Summary
      doc.moveDown();
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Summary", { underline: true });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Total expenses: ${expenses.length}`)
        .text(`Total you paid: €${totalPaid.toFixed(2)}`, {
          fillColor: "green",
        })
        .fillColor("black")
        .text(`Total you owe: €${totalOwed.toFixed(2)}`, { fillColor: "red" })
        .fillColor("black")
        .text(`Net balance: €${(totalPaid - totalOwed).toFixed(2)}`, {
          fillColor: totalPaid - totalOwed >= 0 ? "green" : "red",
        });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        `Generated by Expense Sharing App - ${new Date().toISOString()}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );

    doc.end();
  });
}
