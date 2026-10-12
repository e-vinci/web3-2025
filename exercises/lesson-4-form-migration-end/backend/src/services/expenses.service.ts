import { db } from "../prisma/db.ts";
import {
  dateToDBO,
  expenseFromDBO,
  type Expense,
  type ExpenseFilter,
  type NewExpense,
} from "../types/expense.ts";

/**
 * Every read needs the same relations, so we build the base query in one place.
 */
function expenseQuery() {
  return db.orm.public.Expense
    // `participants` is a many-to-many relation. Prisma walks the join table
    // (`participations`) for us, so we get users back, not join rows.
    .include("participants")
    .include("payer")
    .include("category");
}

export class ExpensesService {
  public static async getExpenses(filter: ExpenseFilter = {}): Promise<Expense[]> {
    let query = expenseQuery();

    // `amount` is a minimum, so it needs a comparison rather than an equality.
    if (filter.amount !== undefined) {
      const minimum = filter.amount;
      query = query.where((expense) => expense.amount.gte(minimum));
    }
    if (filter.payerId !== undefined) {
      query = query.where({ payerId: filter.payerId });
    }
    if (filter.categoryId !== undefined) {
      query = query.where({ categoryId: filter.categoryId });
    }

    const rows = await query.all();
    return rows.map(expenseFromDBO);
  }

  public static async addExpense(newExpense: NewExpense): Promise<Expense> {
    const created = await db.orm.public.Expense.create({
      description: newExpense.description,
      amount: newExpense.amount,
      date: dateToDBO(newExpense.date),
      payerId: newExpense.payerId,
      categoryId: newExpense.categoryId ?? null,
      // `connect` links existing users; Prisma writes the join rows itself.
      participants: (mutator) =>
        mutator.connect(newExpense.participants.map((id) => ({ id }))),
    });

    // `create` returns the bare row, so read it back with its relations
    // to return the same shape as every other method.
    const row = await expenseQuery().where({ id: created.id }).first();
    if (!row) {
      throw new Error("Expense was created but could not be read back");
    }
    return expenseFromDBO(row);
  }
}
