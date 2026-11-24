// Entry point for running the API as a long-lived Node server (local dev, containers).
// Sentry first, then the app via dynamic import so Sentry can instrument its modules.
await import('./instrument.ts');
const { bootstrap } = await import('./bootstrap.ts');

const { app, config, db, logger } = bootstrap();

const server = app.listen(config.PORT, () => {
  logger.info(`API listening on http://localhost:${config.PORT}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close();
  await db.close();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
