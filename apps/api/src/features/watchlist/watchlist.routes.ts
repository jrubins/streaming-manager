import { Router } from 'express';
import {
  AddToWatchlistSchema,
  UpdateWatchlistShowSchema,
  WatchlistShowIdParamsSchema,
} from '@app/shared';
import { currentUserId } from '../../auth/middleware.ts';
import { validate } from '../../lib/validate.ts';
import type { WatchlistService } from './watchlist.service.ts';

export function watchlistRouter(watchlist: WatchlistService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await watchlist.list(currentUserId(req)));
  });

  router.post('/', async (req, res) => {
    const input = validate(AddToWatchlistSchema, req.body);
    res.status(201).json(await watchlist.add(currentUserId(req), input));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = validate(WatchlistShowIdParamsSchema, req.params);
    const input = validate(UpdateWatchlistShowSchema, req.body);
    res.json(await watchlist.update(currentUserId(req), id, input));
  });

  router.post('/:id/refresh', async (req, res) => {
    const { id } = validate(WatchlistShowIdParamsSchema, req.params);
    res.json(await watchlist.refresh(currentUserId(req), id));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = validate(WatchlistShowIdParamsSchema, req.params);
    await watchlist.remove(currentUserId(req), id);
    res.status(204).end();
  });

  return router;
}
