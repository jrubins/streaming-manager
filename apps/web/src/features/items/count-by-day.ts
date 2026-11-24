export interface DayCount {
  day: string;
  count: number;
}

/** Counts records per calendar day (UTC), oldest first. */
export function countByDay(records: readonly { createdAt: string }[]): DayCount[] {
  const counts = new Map<string, number>();
  for (const { createdAt } of records) {
    const day = createdAt.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));
}
