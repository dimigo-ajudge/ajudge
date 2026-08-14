import { HttpException, HttpStatus, type LoggerService } from "@nestjs/common";

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function createApiSuccess<T>(status: number, data: T): ApiSuccess<T> {
  return {
    ok: true,
    status,
    data,
  };
}

export function createApiFailure(exception: unknown, logger?: LoggerService): ApiFailure {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === "string") {
      return { ok: false, status, error: exceptionResponse };
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === "object" &&
      "message" in exceptionResponse
    ) {
      return {
        ok: false,
        status,
        error: (exceptionResponse as { message: unknown }).message,
      };
    }

    return { ok: false, status, error: exceptionResponse };
  }

  if (exception instanceof Error) {
    logger?.error(exception.message, exception.stack);
  } else {
    logger?.error("Unknown error", JSON.stringify(exception));
  }

  return {
    ok: false,
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: "Internal Server Error",
  };
}
