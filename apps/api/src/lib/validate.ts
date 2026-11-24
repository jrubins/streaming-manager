import { z } from 'zod';
import { HttpError } from './http-error.ts';

/** Parses input with a Zod schema, or throws a 400 listing the validation issues. */
export function validate<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(
      400,
      'validation_error',
      'Request is invalid',
      z.treeifyError(result.error),
    );
  }
  return result.data;
}
