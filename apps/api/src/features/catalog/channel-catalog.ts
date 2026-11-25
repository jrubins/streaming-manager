import type { Channel, ChannelCategory } from '@app/shared';

/**
 * Which live TV services carry which channels, in the US. Lineups change and local channels
 * depend on the ZIP code, so this is a starting point: each service links its own lookup.
 * Re-check, and update CHANNELS_AS_OF, every few months.
 */
export const CHANNELS_AS_OF = '2026-11-25';

const YT = 'youtube-tv';
const HL = 'hulu-live-tv';
const SO = 'sling-orange';
const SB = 'sling-blue';
const FU = 'fubotv';
const DT = 'directv-stream';
const PH = 'philo';

type Def = [key: string, name: string, carriers: string[], starter?: boolean];

const CATEGORIES: Record<ChannelCategory, readonly Def[]> = {
  local: [
    ['abc', 'ABC', [YT, HL, FU, DT], true],
    ['cbs', 'CBS', [YT, HL, FU, DT], true],
    ['nbc', 'NBC', [YT, HL, SB, FU, DT], true],
    ['fox', 'FOX', [YT, HL, SB, FU, DT], true],
    ['pbs', 'PBS', [YT, DT]],
    ['cw', 'The CW', [YT, HL, FU, DT]],
  ],
  sports: [
    ['espn', 'ESPN', [YT, HL, SO, DT], true],
    ['espn2', 'ESPN2', [YT, HL, SO, DT]],
    ['fs1', 'FS1', [YT, HL, SB, FU, DT], true],
    ['tnt', 'TNT', [YT, HL, SO, DT], true],
    ['tbs', 'TBS', [YT, HL, SO, DT]],
    ['usa', 'USA Network', [YT, HL, SB, FU, DT]],
    ['nfl-network', 'NFL Network', [YT, SB, FU, DT], true],
    ['big-ten-network', 'Big Ten Network', [YT, HL, FU, DT]],
    ['sec-network', 'SEC Network', [YT, HL, DT]],
    ['acc-network', 'ACC Network', [YT, HL, DT]],
    ['golf-channel', 'Golf Channel', [YT, HL, SB, FU, DT]],
    ['cbs-sports-network', 'CBS Sports Network', [YT, HL, FU]],
  ],
  leagues: [
    ['nfl-sunday-ticket', 'NFL Sunday Ticket', ['nfl-sunday-ticket']],
    ['nba-league-pass', 'NBA League Pass', ['nba-league-pass']],
    ['mlb-tv', 'MLB.TV', ['mlb-tv']],
    // Out-of-market NHL games stream on ESPN Select (and the bundles that include it).
    ['nhl-power-play', 'NHL (ESPN Select)', ['espn-plus']],
  ],
  news: [
    ['cnn', 'CNN', [YT, HL, SO, DT], true],
    ['fox-news', 'Fox News', [YT, HL, SB, FU, DT], true],
    ['msnbc', 'MSNBC', [YT, HL, SB, FU, DT], true],
    ['cnbc', 'CNBC', [YT, HL, SB, FU, DT]],
    ['bloomberg', 'Bloomberg TV', [YT, SB, PH]],
  ],
  entertainment: [
    ['mtv', 'MTV', [YT, HL, FU, DT, PH], true],
    ['comedy-central', 'Comedy Central', [YT, HL, SO, SB, FU, DT, PH], true],
    ['bravo', 'Bravo', [YT, HL, SB, FU, DT], true],
    ['hgtv', 'HGTV', [YT, HL, SO, SB, FU, DT, PH], true],
    ['food-network', 'Food Network', [YT, HL, SO, SB, FU, DT, PH], true],
    ['discovery', 'Discovery', [YT, HL, SO, SB, FU, DT, PH]],
    ['tlc', 'TLC', [YT, HL, SO, SB, FU, DT, PH]],
    ['amc', 'AMC', [YT, HL, SO, SB, FU, DT, PH]],
    ['fx', 'FX', [YT, HL, SB, FU, DT]],
    ['a-and-e', 'A&E', [HL, SO, SB, DT, PH]],
    ['history', 'History', [HL, SO, SB, DT, PH]],
    ['lifetime', 'Lifetime', [HL, SO, SB, DT, PH]],
    ['hallmark', 'Hallmark Channel', [FU, DT, PH]],
    ['paramount-network', 'Paramount Network', [YT, HL, FU, DT, PH]],
  ],
  kids: [
    ['disney-channel', 'Disney Channel', [YT, HL, SO, DT], true],
    ['nickelodeon', 'Nickelodeon', [YT, HL, FU, DT, PH], true],
    ['cartoon-network', 'Cartoon Network', [YT, HL, SO, DT], true],
  ],
};

export const CHANNELS: readonly Channel[] = Object.entries(CATEGORIES).flatMap(([category, defs]) =>
  defs.map(([key, name, carriers, starter = false]) => ({
    key,
    name,
    // Object.entries widens the record's keys to string.
    category: category as ChannelCategory,
    local: category === 'local',
    starter,
    carriers,
  })),
);

/** Each service's own channel lookup (by ZIP code, for local channels). */
export const CHANNEL_LOOKUPS = [
  { name: 'YouTube TV', url: 'https://tv.youtube.com/welcome/' },
  { name: 'Hulu + Live TV', url: 'https://www.hulu.com/live-tv/channels' },
  { name: 'Sling', url: 'https://www.sling.com/channels' },
  { name: 'Fubo', url: 'https://www.fubo.tv/welcome/channels' },
  { name: 'DirecTV Stream', url: 'https://www.directv.com/stream/channels/' },
  { name: 'Philo', url: 'https://www.philo.com/channels' },
];

/** Channels offered in a region (only the US so far). */
export function channelsFor(region: string): readonly Channel[] {
  return region === 'US' ? CHANNELS : [];
}
