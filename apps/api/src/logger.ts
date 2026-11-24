import { pino, type Logger } from 'pino';
import type { Config } from './config.ts';

export function createLogger(config: Pick<Config, 'LOG_LEVEL' | 'NODE_ENV'>): Logger {
  return pino({
    level: config.LOG_LEVEL,
    // Readable logs locally; JSON everywhere else (Vercel, CI).
    ...(config.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : {}),
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
}
