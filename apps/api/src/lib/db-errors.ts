/** True for a Postgres unique-constraint violation (SQLSTATE 23505), however it is wrapped. */
export function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth += 1) {
    if (typeof current !== 'object') return false;
    const record = current as { sqlState?: unknown; code?: unknown; cause?: unknown };
    if (record.sqlState === '23505' || record.code === '23505') return true;
    current = record.cause;
  }
  return false;
}
