/** Identifies a TMDB title across search results and the watchlist. */
export const titleKey = (title: { mediaType: string; tmdbId: number }) =>
  `${title.mediaType}:${title.tmdbId}`;
