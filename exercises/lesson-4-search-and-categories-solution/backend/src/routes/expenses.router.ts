import express from "express";
import { ExpensesService } from "../services/expenses.service.ts";
import { UsersService } from "../services/users.service.ts";
import { CategoriesService } from "../services/categories.service.ts";
import { parseExpenseFilter, parseNewExpense } from "../types/expense.ts";

const expensesRouter = express.Router();

expensesRouter.get("/", async (req, res) => {
  try {
    // One call replaces the pile of hand-written checks we used to have here:
    // the schema in types/expense.ts already knows what a valid filter is.
    const filter = parseExpenseFilter(req.query);
    if (filter === false) {
      return res.status(400).json({ error: "Invalid filter" });
    }

    // Referential checks still belong here: only the database knows whether
    // user 7 or category 3 exists.
    if (filter.payerId !== undefined && !(await UsersService.getById(filter.payerId))) {
      return res.status(404).json({ error: "Payer not found" });
    }
    if (filter.categoryId !== undefined && !(await CategoriesService.getById(filter.categoryId))) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(await ExpensesService.getExpenses(filter));
  } catch (error) {
    console.error("Error getting expenses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

expensesRouter.post("/", async (req, res) => {
  try {
    const newExpense = parseNewExpense(req.body);
    if (newExpense === false) {
      return res.status(400).json({ error: "Invalid expense" });
    }

    if (!(await UsersService.getById(newExpense.payerId))) {
      return res.status(404).json({ error: "Payer not found" });
    }
    if (newExpense.categoryId !== undefined && !(await CategoriesService.getById(newExpense.categoryId))) {
      return res.status(404).json({ error: "Category not found" });
    }

    const created = await ExpensesService.addExpense(newExpense);
    res.status(201).json(created);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default expensesRouter;
