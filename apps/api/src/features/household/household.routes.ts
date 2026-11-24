import { Router } from 'express';
import { JoinHouseholdSchema, UpdateHouseholdSchema, UpdatePreferencesSchema } from '@app/shared';
import { currentUserId, currentUserName } from '../../auth/middleware.ts';
import { validate } from '../../lib/validate.ts';
import type { WatchlistService } from '../watchlist/watchlist.service.ts';
import type { HouseholdService } from './household.service.ts';

export function householdRouter(households: HouseholdService, watchlist: WatchlistService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await households.get(currentUserId(req), currentUserName(req)));
  });

  router.patch('/', async (req, res) => {
    const input = validate(UpdateHouseholdSchema, req.body);
    const userId = currentUserId(req);
    const before = await households.get(userId);
    const household = await households.update(userId, input);
    // Streaming catalogs differ by country: look every title up again for the new one.
    if (household.region !== before.region) await watchlist.refreshAll(userId);
    res.json(household);
  });

  router.get('/preferences', async (req, res) => {
    res.json(await households.preferences(currentUserId(req)));
  });

  router.patch('/preferences', async (req, res) => {
    const input = validate(UpdatePreferencesSchema, req.body);
    res.json(await households.updatePreferences(currentUserId(req), input));
  });

  router.post('/join', async (req, res) => {
    const input = validate(JoinHouseholdSchema, req.body);
    res.json(await households.join(currentUserId(req), input));
  });

  router.post('/leave', async (req, res) => {
    res.json(await households.leave(currentUserId(req)));
  });

  router.post('/invite-code', async (req, res) => {
    res.json(await households.rotateInviteCode(currentUserId(req)));
  });

  return router;
}
