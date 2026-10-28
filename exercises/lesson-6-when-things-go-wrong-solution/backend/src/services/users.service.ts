import { db } from "../prisma/db.ts";
import { userFromDBO, type User } from "../types/user.ts";

export class UsersService {
  public static async getUsers(): Promise<User[]> {
    const rows = await db.orm.public.User.all();
    return rows.map(userFromDBO);
  }

  public static async getById(id: number): Promise<User | undefined> {
    const row = await db.orm.public.User.where({ id }).first();
    return row ? userFromDBO(row) : undefined;
  }
}
