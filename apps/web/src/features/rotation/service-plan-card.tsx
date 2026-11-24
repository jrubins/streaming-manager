import type { RotationState, Service, WatchlistShow } from '@app/shared';
import { cn } from 'cn';
import { Check, CirclePause, CirclePlay, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatList, formatPrice } from '@/lib/format';
import { PosterStrip } from './poster-strip';
import { ServiceLogo } from './service-logo';

const STATES: Record<RotationState, { label: string; tone: string; icon: typeof Check }> = {
  keep: { label: 'Keep', tone: 'bg-keep-soft text-keep', icon: Check },
  pause: { label: 'Pause', tone: 'bg-pause-soft text-pause', icon: CirclePause },
  resume: { label: 'Resume', tone: 'bg-resume-soft text-resume', icon: CirclePlay },
  paused: { label: 'Stay paused', tone: 'bg-muted text-muted-foreground', icon: Moon },
};

interface ServicePlanCardProps {
  service: Service;
  state: RotationState;
  /** Unwatched titles that stream on this service. */
  shows: readonly WatchlistShow[];
  /** For a service left out of the plan: the planned services its titles are also on. */
  coveredBy?: readonly string[];
  /** Records that the member paused or resumed the service as the plan says. */
  onDone?: () => void;
  pending?: boolean;
}

function explain(state: RotationState, shows: number, coveredBy: readonly string[]): string {
  const titles = shows === 1 ? '1 title' : `${shows} titles`;
  switch (state) {
    case 'keep':
      return `Needed for ${titles} on your list`;
    case 'resume':
      return `${titles} waiting for it`;
    case 'pause':
    case 'paused':
      if (shows === 0) {
        return state === 'pause'
          ? 'Nothing on your list streams here'
          : 'Nothing on your list needs it';
      }
      return `${shows === 1 ? 'Its title is' : `All ${titles} are`} also on ${formatList(coveredBy)}`;
  }
}

/** One service in the month's plan: what happens to it, and why. */
export function ServicePlanCard({
  service,
  state,
  shows,
  coveredBy = [],
  onDone,
  pending = false,
}: ServicePlanCardProps) {
  const { label, tone, icon: Icon } = STATES[state];
  const dim = state === 'pause' || state === 'paused';
  return (
    <article
      aria-label={service.name}
      className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_-6px_rgb(0_0_0/0.06)]"
    >
      <header className="flex items-center gap-4 p-5 pb-4">
        <ServiceLogo
          service={service}
          className={cn('size-12 rounded-2xl', state === 'paused' && 'opacity-60 grayscale')}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{service.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {service.planName ?? 'No plan set'}
          </p>
        </div>
        <p className="text-right">
          <span
            className={cn(
              'block text-lg font-semibold tabular-nums',
              dim && 'text-muted-foreground',
            )}
          >
            {formatPrice(service.monthlyPriceCents)}
          </span>
          <span className="block text-xs text-muted-foreground">per month</span>
        </p>
      </header>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {shows.length > 0 ? (
          <PosterStrip shows={shows} muted={dim} />
        ) : (
          <p className="flex min-h-24 flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            No titles
          </p>
        )}
      </div>

      <footer className={cn('flex items-center gap-3 px-5 py-3', tone)}>
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{label}</span>
          <span className="opacity-80"> · {explain(state, shows.length, coveredBy)}</span>
        </p>
        {onDone && (state === 'pause' || state === 'resume') ? (
          <Button
            size="xs"
            variant="outline"
            className="border-current/25 bg-card/70 text-current hover:bg-card"
            disabled={pending}
            onClick={onDone}
            aria-label={
              state === 'pause' ? `I've paused ${service.name}` : `I've resumed ${service.name}`
            }
          >
            Mark done
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
