/**
 * TMDB (JustWatch) lists one streaming service under many providers: plan variants
 * ("Netflix Standard with Ads"), resellers ("Paramount+ Amazon Channel") and renames
 * ("Max" → "HBO Max"). They all unlock the same shows, so they share one provider key.
 */

/** Resold or re-tiered variants: dropping these words leaves the underlying service. */
const VARIANT_SUFFIXES = [
  /\s+(amazon|apple tv|roku premium|youtube|prime video) channels?$/,
  /\s+(standard|basic)?\s*with ads$/,
  /\s+premium plus$/,
  /\s+(premium|essential|select|kids)$/,
];

/** Names whose normalized form doesn't already read as the key we want. */
const ALIASES: readonly [RegExp, string][] = [
  [/^amazon prime video$|^prime video$/, 'amazon-prime-video'],
  [/^disney plus$/, 'disney-plus'],
  [/^(hbo )?max$|^hbo max$/, 'hbo-max'],
  [/^paramount plus( with showtime)?$/, 'paramount-plus'],
  [/^apple tv( plus)?$/, 'apple-tv-plus'],
  [/^mgm plus$|^epix$/, 'mgm-plus'],
];

export function providerKey(providerName: string): string {
  let name = providerName
    .toLowerCase()
    .replace(/\+/g, ' plus')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const suffix of VARIANT_SUFFIXES) name = name.replace(suffix, '').trim();
  const alias = ALIASES.find(([pattern]) => pattern.test(name));
  return alias ? alias[1] : name.replace(/ /g, '-');
}

/** How we name a service, where TMDB's name is a plan or a spelled-out "+". */
const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  'amazon-prime-video': 'Prime Video',
  'apple-tv-plus': 'Apple TV+',
  'disney-plus': 'Disney+',
  'espn-plus': 'ESPN+',
  'hbo-max': 'HBO Max',
  'mgm-plus': 'MGM+',
  'amc-plus': 'AMC+',
  'paramount-plus': 'Paramount+',
  peacock: 'Peacock',
  netflix: 'Netflix',
  hulu: 'Hulu',
};

export function providerDisplayName(key: string, tmdbName: string): string {
  return DISPLAY_NAMES[key] ?? tmdbName;
}
