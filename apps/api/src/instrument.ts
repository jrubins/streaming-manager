// Sentry must initialise before express, pg and http are loaded so it can instrument them.
// Entry points (server.ts, index.ts) import this file first and load the app with a dynamic
// import afterwards. Sentry stays disabled when SENTRY_DSN is not set.
import * as Sentry from '@sentry/node';
import { loadConfig } from './config.ts';

const config = loadConfig();

if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
    ...(config.VERCEL_GIT_COMMIT_SHA ? { release: config.VERCEL_GIT_COMMIT_SHA } : {}),
    tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
    integrations: [
      // Send pino logs to Sentry Logs, and log errors as Sentry issues.
      Sentry.pinoIntegration({ error: { levels: ['error', 'fatal'] } }),
    ],
    // Collect less than Sentry's defaults: no user details, cookies or request bodies.
    // Headers and query params are kept; Sentry always filters out tokens and keys.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
    },
  });
}
