export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly safeMessage: string;

  constructor(code: string, safeMessage: string, status = 400) {
    super(safeMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.safeMessage = safeMessage;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
    this.name = "ConflictError";
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super("NOT_CONFIGURED", message, 503);
    this.name = "ConfigurationError";
  }
}
