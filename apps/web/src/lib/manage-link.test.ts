import { describe, expect, it } from 'vitest';
import { manageLink } from './manage-link';

describe('manageLink', () => {
  it("links to the service's own account page", () => {
    expect(manageLink({ name: 'Hulu', manageUrl: 'https://www.hulu.com/account' })).toEqual({
      href: 'https://www.hulu.com/account',
      site: 'hulu.com',
    });
    expect(
      manageLink({ name: 'Apple TV+', manageUrl: 'https://apps.apple.com/account/subscriptions' })
        .site,
    ).toBe('apple.com');
  });

  it('falls back to a web search for services without a known page', () => {
    const link = manageLink({ name: 'Starz', manageUrl: null });
    expect(link.site).toBeNull();
    expect(new URL(link.href).searchParams.get('q')).toBe(
      'how to pause or cancel Starz subscription',
    );
  });
});
