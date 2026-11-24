import { cn } from 'cn';
import { Repeat } from 'lucide-react';

/** The app's logo: a rotation arrow on the brand gradient. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-hero-from to-hero-to text-hero-foreground shadow-sm',
        className,
      )}
    >
      <Repeat className="size-4" aria-hidden />
    </span>
  );
}
