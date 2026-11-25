import { Router } from 'express';
import { TitleSearchQuerySchema } from '@app/shared';
import { currentUserId } from '../../auth/middleware.ts';
import { validate } from '../../lib/validate.ts';
import type { CatalogService } from './catalog.service.ts';

export function catalogRouter(catalog: CatalogService): Router {
  const router = Router();

  router.get('/providers', async (req, res) => {
    res.json(await catalog.providers(currentUserId(req)));
  });

  router.get('/channels', async (req, res) => {
    res.json(await catalog.channels(currentUserId(req)));
  });

  router.get('/offers', async (req, res) => {
    res.json(await catalog.offers(currentUserId(req)));
  });

  router.get('/regions', async (req, res) => {
    res.json(await catalog.regions());
  });

  router.get('/search', async (req, res) => {
    const { q } = validate(TitleSearchQuerySchema, req.query);
    res.json(await catalog.search(q));
  });

  return router;
}
