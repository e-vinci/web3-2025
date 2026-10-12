import { z } from "zod";

/**
 * A user as the rest of the application understands it.
 *
 * This file is the single place that knows two things:
 *   1. what a valid User looks like (the schema)
 *   2. how to turn a row coming out of Prisma (a "DBO" — database object)
 *      into that User (the `...FromDBO` function)
 *
 * Everything else — routers, services, other type modules — imports from here
 * and never has to think about the database representation again.
 */
export const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.email(),
  bankAccount: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

/** The shape Prisma gives us for a `user` row. */
export interface UserDBO {
  id: number;
  name: string;
  email: string;
  bankAccount: string | null;
}

export function userFromDBO(dbo: UserDBO): User {
  return {
    id: dbo.id,
    name: dbo.name,
    email: dbo.email,
    bankAccount: dbo.bankAccount,
  };
}
