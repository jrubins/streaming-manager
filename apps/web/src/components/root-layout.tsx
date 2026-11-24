import { Link, Outlet, type ErrorComponentProps } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session';
import { UserMenu } from './user-menu';

// Devtools are loaded only in development and never shipped in production bundles.
const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : () => null;

export function RootLayout() {
  const { user, signOut } = useSession();
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center gap-6">
        <span className="font-semibold">App</span>
        <nav className="flex gap-4 text-sm">
          <Link to="/" className="text-muted-foreground [&.active]:text-foreground">
            Home
          </Link>
          <Link to="/items" className="text-muted-foreground [&.active]:text-foreground">
            Items
          </Link>
        </nav>
        {user ? <UserMenu user={user} onSignOut={() => void signOut()} /> : null}
      </header>
      <main>
        <Outlet />
      </main>
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
