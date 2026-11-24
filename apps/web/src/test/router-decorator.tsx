import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { ComponentType } from 'react';

/** Renders a story inside a router (at "/"), for components that use `Link`. */
export function RouterDecorator(Story: ComponentType) {
  const rootRoute = createRootRoute();
  const paths = ['/', '/watchlist', '/services', '/household'];
  const routeTree = rootRoute.addChildren(
    paths.map((path) =>
      createRoute({ getParentRoute: () => rootRoute, path, component: () => <Story /> }),
    ),
  );
  const router = createRouter({ routeTree, history: createMemoryHistory() });
  return <RouterProvider router={router} />;
}
