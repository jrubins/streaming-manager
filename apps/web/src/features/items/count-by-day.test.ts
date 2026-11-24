import { describe, expect, it } from 'vitest';
import { countByDay } from './count-by-day';

describe('countByDay', () => {
  it('counts records per day, oldest first', () => {
    expect(
      countByDay([
        { createdAt: '2026-11-20T10:00:00.000Z' },
        { createdAt: '2026-11-19T09:00:00.000Z' },
        { createdAt: '2026-11-20T23:59:59.000Z' },
      ]),
    ).toEqual([
      { day: '2026-11-19', count: 1 },
      { day: '2026-11-20', count: 2 },
    ]);
  });

  it('returns an empty list for no records', () => {
    expect(countByDay([])).toEqual([]);
  });
});
