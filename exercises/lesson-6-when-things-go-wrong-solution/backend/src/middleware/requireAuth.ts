import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service.ts';

/**
 * The REST half of the question the GraphQL context answers: is this caller
 * carrying a real token?
 *
 * It is Express middleware rather than a check inside each handler, because
 * every route below it needs the same answer. Mounted once in `app.ts`, it
 * covers every route in the router it guards — including ones added later,
 * which is the half that matters.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'You must be logged in' });
  }

  try {
    AuthService.verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
