import { describe, expect, it } from 'vitest';
import { providerDisplayName, providerKey } from '../src/features/catalog/provider-keys.ts';

describe('providerKey', () => {
  it.each([
    ['Netflix', 'netflix'],
    ['Netflix Standard with Ads', 'netflix'],
    ['Netflix basic with Ads', 'netflix'],
    ['Netflix Kids', 'netflix'],
    ['Amazon Prime Video', 'amazon-prime-video'],
    ['Amazon Prime Video with Ads', 'amazon-prime-video'],
    ['Disney Plus', 'disney-plus'],
    ['Max', 'hbo-max'],
    ['HBO Max', 'hbo-max'],
    ['HBO Max Amazon Channel', 'hbo-max'],
    ['Peacock Premium', 'peacock'],
    ['Peacock Premium Plus', 'peacock'],
    ['Paramount Plus', 'paramount-plus'],
    ['Paramount+ Amazon Channel', 'paramount-plus'],
    ['Paramount+ with Showtime', 'paramount-plus'],
    ['Paramount Plus Essential', 'paramount-plus'],
    ['Apple TV+', 'apple-tv-plus'],
    ['Apple TV Plus', 'apple-tv-plus'],
    ['AMC+ Amazon Channel', 'amc-plus'],
    ['Starz Apple TV Channel', 'starz'],
    ['Crunchyroll', 'crunchyroll'],
    ['MGM Plus', 'mgm-plus'],
  ])('%s → %s', (name, key) => {
    expect(providerKey(name)).toBe(key);
  });
});

describe('providerDisplayName', () => {
  it('names services as people know them', () => {
    expect(providerDisplayName('peacock', 'Peacock Premium')).toBe('Peacock');
    expect(providerDisplayName('disney-plus', 'Disney Plus')).toBe('Disney+');
    expect(providerDisplayName('crunchyroll', 'Crunchyroll')).toBe('Crunchyroll');
  });
});
