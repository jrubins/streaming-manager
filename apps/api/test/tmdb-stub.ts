/**
 * A stand-in for the TMDB API (and its image CDN), so tests never call the real service.
 * API tests pass `stub.fetch` to the TMDB client; end-to-end tests run it as a server
 * (`pnpm --filter @app/api tmdb-stub`). Titles are fictional.
 */

interface StubProvider {
  id: number;
  name: string;
  /** Logo file under /logo/, and its colour in the generated SVG. */
  logo: string;
  color: string;
  priority: number;
}

interface StubTitle {
  id: number;
  mediaType: 'tv' | 'movie';
  title: string;
  date: string;
  overview: string;
  color: string;
  /** Region → provider ids by offer type. */
  offers: Record<string, { flatrate?: number[]; ads?: number[]; free?: number[]; rent?: number[] }>;
}

export const STUB_PROVIDERS: readonly StubProvider[] = [
  { id: 8, name: 'Netflix', logo: 'netflix', color: '#b20710', priority: 1 },
  { id: 1796, name: 'Netflix Standard with Ads', logo: 'netflix', color: '#b20710', priority: 40 },
  { id: 9, name: 'Amazon Prime Video', logo: 'prime', color: '#1a98ff', priority: 2 },
  { id: 337, name: 'Disney Plus', logo: 'disney', color: '#113ccf', priority: 3 },
  { id: 15, name: 'Hulu', logo: 'hulu', color: '#1ce783', priority: 4 },
  { id: 1899, name: 'HBO Max', logo: 'max', color: '#002be7', priority: 5 },
  { id: 1825, name: 'HBO Max Amazon Channel', logo: 'max', color: '#002be7', priority: 60 },
  { id: 350, name: 'Apple TV+', logo: 'apple', color: '#1d1d1f', priority: 6 },
  { id: 386, name: 'Peacock Premium', logo: 'peacock', color: '#f5b400', priority: 7 },
  { id: 531, name: 'Paramount Plus', logo: 'paramount', color: '#0064ff', priority: 8 },
  { id: 582, name: 'Paramount+ Amazon Channel', logo: 'paramount', color: '#0064ff', priority: 70 },
  { id: 283, name: 'Crunchyroll', logo: 'crunchyroll', color: '#f47521', priority: 12 },
  { id: 43, name: 'Starz', logo: 'starz', color: '#111111', priority: 14 },
  { id: 73, name: 'Tubi TV', logo: 'tubi', color: '#7408ff', priority: 20 },
  { id: 1768, name: 'ESPN Plus', logo: 'espn', color: '#c8102e', priority: 16 },
  { id: 230, name: 'Crave', logo: 'crave', color: '#00a8e1', priority: 3 },
];

/** Providers listed per region (CA has Crave and fewer US services). */
const REGION_PROVIDERS: Record<string, number[]> = {
  US: [8, 1796, 9, 337, 15, 1899, 1825, 350, 386, 531, 582, 283, 43, 73, 1768],
  CA: [8, 9, 337, 350, 230, 283],
};

export const STUB_TITLES: readonly StubTitle[] = [
  {
    id: 1001,
    mediaType: 'tv',
    title: 'The Long Harbor',
    date: '2024-03-14',
    overview: 'A fishing town keeps a decades-old secret beneath the tide line.',
    color: '#1e3a5f',
    offers: { US: { flatrate: [8] }, CA: { flatrate: [8] } },
  },
  {
    id: 1002,
    mediaType: 'tv',
    title: 'Signal Fires',
    date: '2025-09-02',
    overview: 'Rival lighthouse keepers exchange coded messages across a strait.',
    color: '#7c2d12',
    offers: { US: { flatrate: [1899, 1825] }, CA: { flatrate: [230] } },
  },
  {
    id: 1003,
    mediaType: 'tv',
    title: 'Copper & Thyme',
    date: '2023-05-20',
    overview: 'A burned-out chef reopens her grandmother’s diner.',
    color: '#9a3412',
    offers: { US: { flatrate: [15, 337] }, CA: { flatrate: [337] } },
  },
  {
    id: 1004,
    mediaType: 'movie',
    title: 'Northbound',
    date: '2025-11-07',
    overview: 'Two estranged brothers drive a vintage bus to the Arctic Circle.',
    color: '#0f766e',
    offers: { US: { flatrate: [1796], ads: [386] }, CA: { flatrate: [8] } },
  },
  {
    id: 1005,
    mediaType: 'tv',
    title: 'Glass Orchard',
    date: '2026-02-11',
    overview: 'In a city under glass, a botanist finds a seed that should not exist.',
    color: '#365314',
    offers: { US: { flatrate: [350] }, CA: { flatrate: [350] } },
  },
  {
    id: 1006,
    mediaType: 'movie',
    title: 'The Quiet Meridian',
    date: '2022-08-19',
    overview: 'A cartographer maps a coastline that changes every night.',
    color: '#312e81',
    offers: { US: { flatrate: [43] } },
  },
  {
    id: 1007,
    mediaType: 'tv',
    title: 'Saltwater Kings',
    date: '2024-06-30',
    overview: 'Three families fight over the last oyster beds on the bay.',
    color: '#155e75',
    offers: { US: { flatrate: [582] } },
  },
  {
    id: 1008,
    mediaType: 'movie',
    title: 'Paper Lanterns',
    date: '2021-10-01',
    overview: 'A festival night in a mountain town, told five ways.',
    color: '#a16207',
    offers: { US: { rent: [8] } },
  },
  {
    id: 1009,
    mediaType: 'tv',
    title: 'Static Bloom',
    date: '2026-01-09',
    overview: 'A late-night radio host starts receiving calls from next week.',
    color: '#86198f',
    offers: { US: { flatrate: [386] } },
  },
  {
    id: 1010,
    mediaType: 'tv',
    title: 'Harbor Lights',
    date: '2019-04-04',
    overview: 'An anthology of small mysteries in a port city.',
    color: '#334155',
    offers: { US: { flatrate: [8, 15] } },
  },
  {
    id: 1011,
    mediaType: 'tv',
    title: 'Lantern Season',
    date: '2025-10-03',
    overview: 'A night-market food stall becomes the center of a small-town election.',
    color: '#92400e',
    offers: { US: { flatrate: [8] } },
  },
  {
    id: 1012,
    mediaType: 'movie',
    title: 'Quarry Road',
    date: '2024-02-16',
    overview: 'A retired geologist and her grandson chase a meteorite across the county.',
    color: '#3f6212',
    offers: { US: { flatrate: [8] } },
  },
];

const providerById = new Map(STUB_PROVIDERS.map((p) => [p.id, p]));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function providerRow(provider: StubProvider) {
  return {
    provider_id: provider.id,
    provider_name: provider.name,
    logo_path: `/logo/${provider.logo}.svg`,
    display_priority: provider.priority,
  };
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function poster(title: StubTitle): string {
  const words = title.title.split(' ');
  const lines = words.reduce<string[]>((acc, word) => {
    const last = acc.at(-1);
    if (last !== undefined && (last + ' ' + word).length <= 12)
      acc[acc.length - 1] = `${last} ${word}`;
    else acc.push(word);
    return acc;
  }, []);
  const text = lines
    .map(
      (line, i) =>
        `<text x="20" y="${300 + i * 34}" font-size="30" font-weight="700" fill="#fff" font-family="Georgia, serif">${escapeXml(line)}</text>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${title.color}"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient></defs><rect width="342" height="513" fill="url(#g)"/><circle cx="250" cy="130" r="70" fill="#ffffff" opacity="0.12"/>${text}<text x="20" y="480" font-size="16" fill="#ffffffaa" font-family="sans-serif">${title.date.slice(0, 4)}</text></svg>`;
}

function logo(provider: StubProvider): string {
  const label = provider.name
    .replace(/ (Premium|Plus|TV\+?|Amazon Channel|Standard with Ads)$/g, '')
    .slice(0, 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="18" fill="${provider.color}"/><text x="46" y="62" font-size="46" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">${escapeXml(label)}</text></svg>`;
}

function svg(body: string): Response {
  return new Response(body, { headers: { 'content-type': 'image/svg+xml' } });
}

export interface TmdbStub {
  fetch: typeof fetch;
  handle(request: Request): Response;
  /** Replaces where a title streams in a region (to test refreshing). */
  setOffers(tmdbId: number, region: string, flatrate: number[]): void;
}

export function createTmdbStub(): TmdbStub {
  const titles = new Map(STUB_TITLES.map((t) => [t.id, structuredClone(t)]));

  function handle(request: Request): Response {
    const url = new URL(request.url);
    const path = url.pathname;

    const image = /\/(?:w\d+|original)\/(poster|logo)\/([\w-]+)\.svg$/.exec(path);
    if (image) {
      if (image[1] === 'poster') {
        const title = titles.get(Number(image[2]));
        return title ? svg(poster(title)) : new Response('not found', { status: 404 });
      }
      const provider = STUB_PROVIDERS.find((p) => p.logo === image[2]);
      return provider ? svg(logo(provider)) : new Response('not found', { status: 404 });
    }

    if (!/^Bearer .{20,}/.test(request.headers.get('authorization') ?? '')) {
      return json({ status_message: 'Invalid API key' }, 401);
    }

    if (path === '/3/search/multi') {
      const query = (url.searchParams.get('query') ?? '').toLowerCase();
      const results = [...titles.values()]
        .filter((t) => t.title.toLowerCase().includes(query))
        .map((t) => ({
          id: t.id,
          media_type: t.mediaType,
          ...(t.mediaType === 'tv'
            ? { name: t.title, first_air_date: t.date }
            : { title: t.title, release_date: t.date }),
          poster_path: `/poster/${t.id}.svg`,
          overview: t.overview,
        }));
      // People show up in multi-search too; the client must skip them.
      return json({
        page: 1,
        results: [{ id: 9, media_type: 'person', name: 'Harbor Person' }, ...results],
      });
    }

    if (path === '/3/watch/providers/regions') {
      return json({
        results: [
          { iso_3166_1: 'US', english_name: 'United States of America' },
          { iso_3166_1: 'CA', english_name: 'Canada' },
        ],
      });
    }

    const list = /^\/3\/watch\/providers\/(tv|movie)$/.exec(path);
    if (list) {
      const ids = REGION_PROVIDERS[url.searchParams.get('watch_region') ?? ''] ?? [];
      return json({ results: ids.flatMap((id) => providerById.get(id) ?? []).map(providerRow) });
    }

    const detail = /^\/3\/(tv|movie)\/(\d+)$/.exec(path);
    if (detail) {
      const title = titles.get(Number(detail[2]));
      if (!title || title.mediaType !== detail[1]) {
        return json({ status_message: 'The resource you requested could not be found.' }, 404);
      }
      const results = Object.fromEntries(
        Object.entries(title.offers).map(([region, offers]) => [
          region,
          Object.fromEntries(
            Object.entries(offers).map(([type, ids]) => [
              type,
              ids.flatMap((id) => providerById.get(id) ?? []).map(providerRow),
            ]),
          ),
        ]),
      );
      return json({
        id: title.id,
        ...(title.mediaType === 'tv'
          ? { name: title.title, first_air_date: title.date }
          : { title: title.title, release_date: title.date }),
        poster_path: `/poster/${title.id}.svg`,
        overview: title.overview,
        'watch/providers': { results },
      });
    }

    return json({ status_message: 'Unknown endpoint' }, 404);
  }

  return {
    handle,
    fetch: (input, init) =>
      Promise.resolve(handle(input instanceof Request ? input : new Request(input, init))),
    setOffers(tmdbId, region, flatrate) {
      const title = titles.get(tmdbId);
      if (title) title.offers[region] = { flatrate };
    },
  };
}
