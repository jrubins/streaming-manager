import { Router } from 'express';
import { currentUserId } from '../../auth/middleware.ts';
import type { RotationService } from './rotation.service.ts';

export function rotationRouter(rotation: RotationService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await rotation.plan(currentUserId(req)));
  });

  return router;
}
