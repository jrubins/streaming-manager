import { Router } from 'express';
import type { HealthService } from './health.service.ts';

export function healthRouter(health: HealthService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const body = await health.check();
    res.status(body.status === 'ok' ? 200 : 503).json(body);
  });

  return router;
}
