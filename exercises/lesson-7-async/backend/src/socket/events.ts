import { io } from "@/server";

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
    io.to(`user-${participantId}`).emit("expense:created", event);
  });

  console.log(
    `📢 Expense created event sent to ${event.participantIds.length} users`
  );
}

export function emitExpenseUpdated(
  event: ExpenseUpdatedEvent,
  participantIds: number[]
) {
  participantIds.forEach((participantId) => {
    io.to(`user-${participantId}`).emit("expense:updated", event);
  });

  console.log(
    `📢 Expense updated event sent to ${participantIds.length} users`
  );
}

export function emitReportReady(event: ReportReadyEvent) {
  io.to(`user-${event.userId}`).emit("report:ready", event);
  console.log(`📢 Report ready event sent to user ${event.userId}`);
}
