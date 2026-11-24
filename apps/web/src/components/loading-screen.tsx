import { cn } from 'cn';
import { LoaderCircle } from 'lucide-react';

/**
 * Full-screen placeholder while the session or a page's data loads. Nothing is visible for the
 * first half second (most loads, like a reload, finish sooner, so the page doesn't flash); after
 * that a spinner fades in, spinning unless the user asked for reduced motion. Screen readers
 * hear "Loading" straight away.
 * `inline` fits it inside the app layout (a page loading) instead of filling the screen.
 */
export function LoadingScreen({ inline = false }: { inline?: boolean }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center', inline ? 'min-h-[50svh]' : 'min-h-svh')}
    >
      <span className="sr-only">Loading</span>
      <LoaderCircle
        aria-hidden
        className="animate-in fade-in-0 fill-mode-both text-muted-foreground size-8 delay-500 duration-500 motion-safe:animate-spin"
      />
    </div>
  );
}
