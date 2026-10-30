import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service.ts';
import type { UserJWT } from '../types/auth.ts';

/**
 * The REST half of the question the GraphQL context answers: is this caller
 * carrying a real token?
 *
 * It is Express middleware rather than a check inside each handler, because
 * every route below it needs the same answer. Mounted once in `app.ts`, it
 * covers every route in the router it guards — including ones added later,
 * which is the half that matters.
 *
 * Since lesson 7 it also *remembers* who the caller is, in `res.locals`. The
 * export routes need more than "is this a real token": they need "whose
 * expenses, and may you read this export?". Verifying the token twice — once
 * here and again in the handler — is how two copies of that logic drift apart.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  return verifyAndContinue(token, res, next);
}

/**
 * The same check, reading the token from `?token=` instead of the header.
 * Used where the browser itself makes the request (WebSocket upgrade, CSV
 * download) — see exercise 5's "headers are gone" note for why that forces
 * the token into the URL, and what production does instead.
 */
export function requireAuthQuery(req: Request, res: Response, next: NextFunction) {
  const token = typeof req.query['token'] === 'string' ? req.query['token'] : '';

  return verifyAndContinue(token, res, next);
}

function verifyAndContinue(token: string, res: Response, next: NextFunction) {
  if (!token) {
    return res.status(401).json({ error: 'You must be logged in' });
  }

  try {
    res.locals['userJWT'] = AuthService.verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Reads back what the middleware stored.
 *
 * `res.locals` is typed as a bag of `any`, so every handler that touched it
 * directly would be one typo away from `undefined`. One accessor, used
 * everywhere, turns that into a single cast in a single place.
 *
 * It throws rather than returning `undefined` because calling it on a route
 * that is not behind `requireAuth` is a programming mistake, not a runtime
 * condition — and a loud failure in development beats a silent `undefined` in
 * production.
 */
export function currentUser(res: Response): UserJWT {
  const userJWT = res.locals['userJWT'] as UserJWT | undefined;
  if (!userJWT) {
    throw new Error('currentUser() called on a route that is not behind requireAuth');
  }
  return userJWT;
}
