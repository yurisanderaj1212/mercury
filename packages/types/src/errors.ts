/**
 * Base exception for all Mercury domain errors.
 * Always carries a machine-readable error code and an HTTP status code.
 */
export class MercuryException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — Input validation failed */
export class ValidationException extends MercuryException {
  constructor(code = 'VALIDATION_ERROR', message = 'Validation failed') {
    super(code, message, 400);
  }
}

/** 401 — Authentication required */
export class UnauthorizedException extends MercuryException {
  constructor(code = 'UNAUTHORIZED', message = 'Unauthorized') {
    super(code, message, 401);
  }
}

/** 403 — Authenticated but not allowed */
export class ForbiddenException extends MercuryException {
  constructor(code = 'FORBIDDEN', message = 'Forbidden') {
    super(code, message, 403);
  }
}

/** 404 — Resource not found */
export class NotFoundException extends MercuryException {
  constructor(code = 'NOT_FOUND', message = 'Not found') {
    super(code, message, 404);
  }
}

/** 409 — Resource already exists */
export class ConflictException extends MercuryException {
  constructor(code = 'CONFLICT', message = 'Conflict') {
    super(code, message, 409);
  }
}

/** 422 — Business rule violation */
export class BusinessRuleException extends MercuryException {
  constructor(code = 'BUSINESS_RULE_VIOLATION', message = 'Business rule violation') {
    super(code, message, 422);
  }
}
