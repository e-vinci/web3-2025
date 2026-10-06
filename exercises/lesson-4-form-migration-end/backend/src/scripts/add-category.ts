import { db } from "../prisma/db.ts";
import type { Category } from "../types/category.ts";

const categories: Category[] = [
  {
    id: 0,
    name: "Groceries",
    colour: "red",
  },
  {
    id: 1,
    name: "House Expenses",
    colour: "blue",
  },
  {
    id: 2,
    name: "Entertainment",
    colour: "green",
  },
];

async function populate() {
  console.log("populating categories...");
  await Promise.all(
    categories.map(async (category) => {
      await db.orm.public.Category.create(category);
    })
  );
  console.log("...Done!");
}

populate()