import type { Service } from '@app/shared';

export interface ManageLink {
  href: string;
  /** Where it goes, for labels: "hulu.com", or null for a web search. */
  site: string | null;
}

/**
 * Where to pause, cancel or resume a service: its own account page when we know it, else a
 * web search for how to do it.
 */
export function manageLink(service: Pick<Service, 'name' | 'manageUrl'>): ManageLink {
  if (service.manageUrl) {
    const host = new URL(service.manageUrl).hostname.replace(/^(www|secure|apps)\./, '');
    return { href: service.manageUrl, site: host };
  }
  const query = `how to pause or cancel ${service.name} subscription`;
  return { href: `https://www.google.com/search?${new URLSearchParams({ q: query })}`, site: null };
}
