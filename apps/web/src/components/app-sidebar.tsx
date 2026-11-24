import { Link } from '@tanstack/react-router';
import { CalendarCheck, Clapperboard, LogOut, Tv, Users } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { SessionUser } from '@/lib/session';

export interface AppSidebarProps {
  user: SessionUser | null;
  householdName: string | null;
  /** Unwatched titles and active services, for the nav badges. */
  toWatchCount: number | null;
  activeServiceCount: number | null;
  onSignOut: () => void;
}

const NAV = [
  { to: '/', label: 'Plan', icon: CalendarCheck },
  { to: '/watchlist', label: 'Watchlist', icon: Clapperboard },
  { to: '/services', label: 'Services', icon: Tv },
  { to: '/household', label: 'Household', icon: Users },
] as const;

function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0]?.[0]}${parts[1]?.[0]}` : name.slice(0, 2)).toUpperCase();
}

export function AppSidebar({
  user,
  householdName,
  toWatchCount,
  activeServiceCount,
  onSignOut,
}: AppSidebarProps) {
  const badges: Partial<Record<(typeof NAV)[number]['to'], number | null>> = {
    '/watchlist': toWatchCount,
    '/services': activeServiceCount,
  };
  const displayName = user ? (user.name ?? user.email ?? user.id) : null;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="size-9" />
          <span className="min-w-0">
            <span className="block font-semibold tracking-tight text-sidebar-accent-foreground">
              Stream Rotation
            </span>
            {householdName ? (
              <span className="block truncate text-xs text-sidebar-foreground">
                {householdName}
              </span>
            ) : null}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ to, label, icon: Icon }) => {
                const badge = badges[to];
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild size="lg" className="h-10">
                      <Link
                        to={to}
                        activeOptions={{ exact: to === '/' }}
                        className="data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground [&.active_svg]:text-sidebar-primary"
                      >
                        <Icon aria-hidden />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="top-2.5 text-sidebar-foreground">
                        {badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && displayName ? (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground"
            >
              {initials(displayName)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-sidebar-accent-foreground">
              {displayName}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
