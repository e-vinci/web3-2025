import { db } from "../prisma/db.ts";
import { type User } from "../types/user.ts";

export class UsersService {

  public static async getUsers(): Promise<User[]> {
    try {
      const rows = await db.orm.public.User.all();
      const users = rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        bankAccount: row.bankAccount,
      }));
      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  }

  public static async getById(id: number): Promise<User | undefined> {
    try {
      const row = await db.orm.public.User.where({ id }).all();
      if (!row || row.length === 0) {
        return undefined;
      }
      return {
        id: row[0].id,
        name: row[0].name,
        email: row[0].email,
        bankAccount: row[0].bankAccount,
      };
    } catch (error) {
      console.error("Error getting user by id:", error);
      throw error;
    }
  }
  
}