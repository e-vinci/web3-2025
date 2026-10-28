import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { db } from '../prisma/db.ts';
import { JWT_SECRET } from '../types/auth.ts';
import type { LoginInput, RegisterInput, UserJWT } from '../types/auth.ts';
import { userFromDBO, type User } from '../types/user.ts';

const SALT_ROUNDS = 10;

/**
 * The business half of authentication: who may have an account, and whether a
 * password is right.
 *
 * It returns a `User`, not an `AuthResponse`. Minting a token is a different
 * job — it belongs to `authResponseFromUser` in `types/auth.ts`, next to the
 * type it produces. This service never thinks about tokens on the way out.
 */
export class AuthService {
  static async register(input: RegisterInput): Promise<User> {
    const existingUser = await db.orm.public.User.where({ email: input.email }).first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // `bcrypt.hash` is deliberately slow — that is the whole point of it. The
    // plain password exists only inside this function and is never stored.
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const userDbo = await db.orm.public.User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return userFromDBO(userDbo);
  }

  static async login(input: LoginInput): Promise<User> {
    const userDbo = await db.orm.public.User.where({ email: input.email }).first();

    if (!userDbo) {
      throw new Error('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(input.password, userDbo.passwordHash);

    if (!validPassword) {
      // Deliberately the same message as "no such user". See the router.
      throw new Error('Invalid email or password');
    }

    return userFromDBO(userDbo);
  }

  /** The inverse of signing: turn a token back into the claims it carries. */
  static verifyToken(token: string): UserJWT {
    try {
      return jwt.verify(token, JWT_SECRET) as UserJWT;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
