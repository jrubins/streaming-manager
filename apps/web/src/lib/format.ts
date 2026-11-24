const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** "$12.99", or "—" for an unknown price. */
export function formatPrice(cents: number | null): string {
  return cents === null ? '—' : usd.format(cents / 100);
}

/** "Netflix, Hulu and Max". */
export function formatList(items: readonly string[]): string {
  return new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' }).format(items);
}
