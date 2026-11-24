import { describe, expect, it } from 'vitest';
import { HealthSchema } from './health.ts';

describe('HealthSchema', () => {
  it('accepts a valid payload', () => {
    const value = {
      status: 'ok',
      database: 'up',
      version: '1.0.0',
      time: new Date().toISOString(),
    };
    expect(HealthSchema.parse(value)).toEqual(value);
  });

  it('rejects an unknown status', () => {
    expect(
      HealthSchema.safeParse({ status: 'nope', database: 'up', version: '1', time: '' }).success,
    ).toBe(false);
  });
});
