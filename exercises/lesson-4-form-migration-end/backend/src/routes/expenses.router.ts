
import express from "express";
import type { Expense, ExpenseFilter } from "../types/expense.ts";
import { ExpensesService } from "../services/expenses.service.ts";
import { isValidNewExpense } from "../guards/expenses.guard.ts";
import { UsersService } from "../services/users.service.ts";
import { CategoriesService } from "../services/categories.service.ts";

const expensesRouter = express.Router();

expensesRouter.get("/", async (req, res) => {
  try {
    const filter: ExpenseFilter = {};
    if (req.query.amount && typeof req.query.amount === 'string' && !isNaN(Number(req.query.amount))) {
      filter.amount = Number(req.query.amount);
    }
    if (req.query.payerId && typeof req.query.payerId === 'string') {
      filter.payerId = parseInt(req.query.payerId);
      if (isNaN(filter.payerId)) {
        return res.status(400).json({ error: "Invalid payerId" });
      }
      const payer = await UsersService.getById(filter.payerId);
      if (!payer) {
        return res.status(404).json({ error: "Payer not found" });
      }
    }
    if (req.query.categoryId && typeof req.query.categoryId === 'string') {
      filter.categoryId = parseInt(req.query.categoryId);
      if (isNaN(filter.categoryId)) {
        return res.status(400).json({ error: "Invalid categoryId" });
      }
      const category = await CategoriesService.getById(filter.categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }
    const expenses = await ExpensesService.getExpenses(filter);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

expensesRouter.post("/", async (req, res) => {
  console.log("POST /api/expenses");
  try {
    const expense: Expense = req.body;
    if (!isValidNewExpense(expense)) {
      return res.status(400).json({ error: "Invalid expense" });
    }
    const expenses = await ExpensesService.addExpense(expense);
    res.status(201).json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// expensesRouter.post("/reset", (req, res) => {
//   try {
//     const expenses = ExpensesService.resetExpenses();
//     res.json(expenses);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

export default expensesRouter;