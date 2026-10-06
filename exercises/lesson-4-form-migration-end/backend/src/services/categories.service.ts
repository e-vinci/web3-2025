import { db } from "../prisma/db.ts";

export class CategoriesService {
  public static async getCategories() {
    const rows = await db.orm.public.Category.all();
    const categories = rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
    return categories;
  }
  
  public static async getById(id: number) {
    const row = await db.orm.public.Category.where({ id }).all();
    if (!row || row.length === 0) {
      return null;
    }
    return {
      id: row[0].id,
      name: row[0].name,
      colour: row[0].colour,
    };
  }
}
