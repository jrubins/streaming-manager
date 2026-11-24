import type { Service } from '@app/shared';
import { cn } from 'cn';

/** A service's logo (decorative: its name is always shown next to it). */
export function ServiceLogo({
  service,
  className,
}: {
  service: Pick<Service, 'name' | 'logoUrl'>;
  className?: string;
}) {
  return service.logoUrl ? (
    <img
      src={service.logoUrl}
      alt=""
      className={cn('size-11 shrink-0 rounded-xl object-cover shadow-sm', className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold text-muted-foreground',
        className,
      )}
    >
      {service.name.slice(0, 1)}
    </span>
  );
}
