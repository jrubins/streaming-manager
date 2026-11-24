import * as Sentry from '@sentry/react';
import type { AppRouter } from '@/router';
import { env } from './env';

/** Starts Sentry (errors, tracing, session replay). Does nothing while VITE_SENTRY_DSN is unset. */
export function initSentry(router: AppRouter) {
  if (!env.sentry.dsn) return;

  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.sentry.environment,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      // Recordings mask all text and block all media, so no user content leaves the browser.
      Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
    ],
    tracesSampleRate: env.sentry.tracesSampleRate,
    // Send trace headers to our API only, so frontend and API spans join one trace.
    tracePropagationTargets: [env.apiUrl],
    replaysSessionSampleRate: env.sentry.replaySessionSampleRate,
    replaysOnErrorSampleRate: env.sentry.replayOnErrorSampleRate,
    // Collect less than Sentry's defaults: no user details, cookies or request bodies.
    dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
  });
}
