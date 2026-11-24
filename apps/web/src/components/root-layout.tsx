import { useQuery } from '@tanstack/react-query';
import { Outlet, type ErrorComponentProps } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { householdQueryOptions } from '@/features/household/queries';
import { servicesQueryOptions } from '@/features/services/queries';
import { watchlistQueryOptions } from '@/features/watchlist/queries';
import { useSession } from '@/lib/session';

// Devtools are loaded only in development and never shipped in production bundles.
const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : () => null;

export function RootLayout() {
  const { user, signOut } = useSession();
  const household = useQuery(householdQueryOptions);
  const watchlist = useQuery(watchlistQueryOptions);
  const services = useQuery(servicesQueryOptions);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          user={user}
          householdName={household.data?.name ?? null}
          toWatchCount={watchlist.data?.filter((show) => !show.watched).length ?? null}
          activeServiceCount={services.data?.filter((s) => s.status === 'active').length ?? null}
          onSignOut={() => void signOut()}
        />
        <SidebarInset className="min-w-0">
          <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
            <SidebarTrigger />
            <BrandMark className="size-7" />
            <span className="font-semibold tracking-tight">Stream Rotation</span>
          </header>
          <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <Outlet />
          </div>
          <footer className="mx-auto w-full max-w-6xl px-5 pb-6 text-xs text-muted-foreground sm:px-8 lg:px-12">
            Title data from TMDB. Streaming availability by JustWatch. This product uses the TMDB
            API but is not endorsed or certified by TMDB.
          </footer>
        </SidebarInset>
      </SidebarProvider>
      <Suspense>
        <Devtools />
      </Suspense>
    </TooltipProvider>
  );
}

export function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="space-y-3">
      <p className="font-medium">Something went wrong.</p>
      <p className="text-sm text-muted-foreground">
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
