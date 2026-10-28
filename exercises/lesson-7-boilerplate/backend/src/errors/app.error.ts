/**
 * An error that carries the two things every transport needs: an HTTP status
 * code, and a short machine-readable code.
 *
 * Without this, a `catch` block has to guess. Was that failure a 400, a 401 or
 * a 500? Every route guesses separately, and they disagree. Here the decision
 * is made once, where the error is thrown, by the code that actually knows.
 *
 * Two useful classes, not six: the inheritance is not the point. The point is
 * that an error knows its own status.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** 401 — we do not know who you are. */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

/** 403 — we know who you are, and you may not do this. */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 404 — there is nothing here (or nothing you are allowed to know about). */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
