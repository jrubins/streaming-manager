import { Link, Outlet, type ErrorComponentProps } from '@tanstack/react-router';
import { Repeat } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session';
import { UserMenu } from './user-menu';

// Devtools are loaded only in development and never shipped in production bundles.
const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : () => null;

export function RootLayout() {
  const { user, signOut } = useSession();
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-10 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Repeat className="size-4" aria-hidden />
          </span>
          Stream Rotation
        </Link>
        <nav className="flex gap-5 text-sm font-medium">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground [&.active]:text-foreground"
          >
            Plan
          </Link>
        </nav>
        {user ? <UserMenu user={user} onSignOut={() => void signOut()} /> : null}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16 border-t pt-4 text-xs text-muted-foreground">
        Title data from TMDB. Streaming availability by JustWatch. This product uses the TMDB API
        but is not endorsed or certified by TMDB.
      </footer>
      <Suspense>
        <Devtools />
      </Suspense>
    </div>
  );
}

export function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="space-y-3">
      <p className="font-medium">Something went wrong.</p>
      <p className="text-muted-foreground text-sm">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

export function NotFound() {
  return <p className="text-muted-foreground">Page not found.</p>;
}
