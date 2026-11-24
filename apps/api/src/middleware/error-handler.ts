import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiError } from '@app/shared';
import { HttpError, notFound } from '../lib/http-error.ts';

export const notFoundHandler: RequestHandler = (req) => {
  throw notFound(`No route for ${req.method} ${req.path}`);
};

/** Status of errors raised by Express middleware (e.g. malformed JSON is a 400). */
function middlewareStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

/** Turns any thrown error into the shared `ApiError` JSON shape. Hides internals on 5xx. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // A response that has already started can't be replaced with JSON: let Express end it.
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let body: ApiError = { error: { code: 'internal_error', message: 'Something went wrong' } };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else {
    const clientStatus = middlewareStatus(err);
    if (clientStatus) {
      status = clientStatus;
      body = { error: { code: 'bad_request', message: (err as Error).message } };
    }
  }

  if (status >= 500) req.log.error({ err }, 'request failed');
  res.status(status).json(body);
};
