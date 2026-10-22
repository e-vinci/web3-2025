import jwt from "jsonwebtoken";
import { z } from "zod";

import type { User } from "./user.ts";

/**
 * Everything the application knows about registering and logging in.
 *
 * Same shape as `types/expense.ts`: the schema, the inferred type, and a
 * `parseX()` that returns the parsed value or `false`. Login and registration
 * are the two most attacked endpoints in any application, so they get the same
 * guard as everything else rather than trusting `req.body`.
 */
export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  // Long enough to be worth hashing. Length is the only password rule that is
  // consistently supported by evidence; "one uppercase, one symbol" is not.
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * What we put *inside* a token, and therefore what comes back out of one.
 *
 * This is not a `User`. It is the handful of claims the server signed, and the
 * field is `userId` rather than `id` precisely so the two never get mistaken
 * for each other at a call site: `userJWT.userId` versus `user.id`.
 *
 * Anyone holding the token can read this. Nothing secret goes in it.
 */
export interface UserJWT {
  userId: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * The secret every token is signed with — and checked against.
 *
 * It lives here because two different files need it: `authResponseFromUser`
 * below signs tokens with it, and `auth.service.ts` verifies them with it.
 * Written down once, so the two can never disagree.
 *
 * The fallback exists so a fresh clone starts. It is not a default you keep: a
 * server signing tokens with a value printed in a public lesson is a server
 * anyone can mint a token for. Put a real one in `.env`, and a different one on
 * Render.
 */
export const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-do-not-use";

/** How long a token stays valid. After this, the server stops accepting it. */
const TOKEN_LIFETIME = "7d";

/**
 * Turns a user into the answer `/register` and `/login` send back.
 *
 * It is the same idea as the `...FromDBO` mappers in the other type modules:
 * one place owns the conversion, so no route has to remember what an
 * `AuthResponse` contains.
 *
 * Notice what does *not* travel. `User` has a `bankAccount`; this mapper does
 * not copy it, because logging in is not a reason to hand it over. Listing the
 * fields by hand rather than spreading `...user` is what makes that a decision
 * instead of an accident — and it is what stops a field you add next month from
 * leaking the day you add it.
 */
export function authResponseFromUser(user: User): AuthResponse {
  // The payload is readable by anyone holding the token — it is signed, not
  // hidden. Put in it only what the server needs to recognise the caller again.
  const payload: UserJWT = { userId: user.id, email: user.email };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

function parseWithSchema<T>(schema: z.ZodType<T>, data: unknown): T | false {
  const result = schema.safeParse(data);
  return result.success ? result.data : false;
}

export function parseRegisterInput(data: unknown): RegisterInput | false {
  return parseWithSchema(registerSchema, data);
}

export function parseLoginInput(data: unknown): LoginInput | false {
  return parseWithSchema(loginSchema, data);
}
