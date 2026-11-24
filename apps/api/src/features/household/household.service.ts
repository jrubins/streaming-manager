import { randomBytes } from 'node:crypto';
import type { Db } from '@app/db';
import type {
  Household,
  HouseholdMember,
  JoinHousehold,
  HouseholdMemberships,
  Preferences,
  UpdateHousehold,
  UpdatePreferences,
} from '@app/shared';
import { isUniqueViolation } from '../../lib/db-errors.ts';
import { HttpError, notFound } from '../../lib/http-error.ts';
import { MEMBERSHIPS } from '../catalog/perk-catalog.ts';

/** The household a user acts in: every other service scopes its data by `id`. */
export interface HouseholdContext {
  id: number;
  region: string;
}

/** Unambiguous characters only, so a code read aloud or retyped still works. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newInviteCode(): string {
  const bytes = randomBytes(10);
  const chars = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}

/**
 * Households own all data. A user belongs to exactly one, created the first time they use
 * the app, and can join another with its invite code.
 */
export function createHouseholdService(db: Db) {
  const Household = db.orm.public.Household;
  const Member = db.orm.public.HouseholdMember;

  async function createFor(userId: string, displayName: string | null): Promise<void> {
    const household = await Household.create({
      name: displayName ? `${displayName.split(' ')[0]}'s household` : 'Our household',
      region: 'US',
      inviteCode: newInviteCode(),
    });
    try {
      await Member.create({ userId, householdId: household.id, displayName });
    } catch (error) {
      // A concurrent first request already created this user's household: use that one.
      await Household.where({ id: household.id }).delete();
      if (!isUniqueViolation(error)) throw error;
    }
  }

  async function membership(userId: string, displayName: string | null = null) {
    const existing = await Member.where({ userId }).first();
    if (existing) {
      if (displayName && existing.displayName !== displayName) {
        await Member.where({ userId }).update({ displayName });
      }
      return existing;
    }
    await createFor(userId, displayName);
    const created = await Member.where({ userId }).first();
    if (!created) throw new Error(`Household membership for ${userId} was not created`);
    return created;
  }

  async function load(userId: string, householdId: number): Promise<Household> {
    const household = await Household.where({ id: householdId }).first();
    if (!household) throw notFound('Household not found');
    const members = await Member.where({ householdId })
      .orderBy([(m) => m.joinedAt.asc(), (m) => m.userId.asc()])
      .limit(50)
      .all();
    return {
      id: household.id,
      name: household.name,
      region: household.region,
      inviteCode: household.inviteCode,
      members: members.map((member): HouseholdMember => ({
        userId: member.userId,
        displayName: member.displayName,
        joinedAt: member.joinedAt.toISOString(),
        isYou: member.userId === userId,
      })),
    };
  }

  /** Leaves the current household, deleting it (and its data) if nobody else is in it. */
  async function removeIfEmpty(householdId: number): Promise<void> {
    const remaining = await Member.where({ householdId }).first();
    if (!remaining) await Household.where({ id: householdId }).delete();
  }

  async function readPreferences(householdId: number): Promise<Preferences> {
    const household = await Household.where({ id: householdId }).first();
    if (!household) throw notFound('Household not found');
    return {
      allowAds: household.allowAds,
      minStreams: household.minStreams,
      require4k: household.require4k,
      requireDownloads: household.requireDownloads,
      suggestNewServices: household.suggestNewServices,
    };
  }

  return {
    /** The acting user's household (created on first use). */
    async context(userId: string): Promise<HouseholdContext> {
      const member = await membership(userId);
      const household = await Household.where({ id: member.householdId }).first();
      if (!household) throw notFound('Household not found');
      return { id: household.id, region: household.region };
    },

    async get(userId: string, displayName: string | null = null): Promise<Household> {
      const member = await membership(userId, displayName);
      return load(userId, member.householdId);
    },

    async update(userId: string, input: UpdateHousehold): Promise<Household> {
      const member = await membership(userId);
      if (input.name !== undefined || input.region !== undefined) {
        await Household.where({ id: member.householdId }).update(input);
      }
      return load(userId, member.householdId);
    },

    async join(userId: string, input: JoinHousehold): Promise<Household> {
      const code = input.inviteCode.trim().toUpperCase();
      const target = await Household.where({ inviteCode: code }).first();
      if (!target) throw new HttpError(404, 'invalid_invite', 'No household has that invite code');
      const member = await membership(userId);
      if (member.householdId !== target.id) {
        await Member.where({ userId }).update({ householdId: target.id });
        await removeIfEmpty(member.householdId);
      }
      return load(userId, target.id);
    },

    /** Starts a new, empty household of the user's own. */
    async leave(userId: string): Promise<Household> {
      const member = await membership(userId);
      await Member.where({ userId }).delete();
      await removeIfEmpty(member.householdId);
      const fresh = await membership(userId, member.displayName);
      return load(userId, fresh.householdId);
    },

    /** What the household needs from its plans. */
    async preferences(userId: string): Promise<Preferences> {
      const member = await membership(userId);
      return readPreferences(member.householdId);
    },

    /** Keys of the memberships with streaming perks that the household has. */
    async memberships(userId: string): Promise<HouseholdMemberships> {
      const member = await membership(userId);
      const household = await Household.where({ id: member.householdId }).first();
      if (!household) throw notFound('Household not found');
      return { memberships: [...household.memberships] };
    },

    async setMemberships(
      userId: string,
      input: HouseholdMemberships,
    ): Promise<HouseholdMemberships> {
      const known = new Set(MEMBERSHIPS.map((m) => m.key));
      const unknown = input.memberships.find((key) => !known.has(key));
      if (unknown !== undefined) {
        throw new HttpError(400, 'unknown_membership', `Unknown membership: ${unknown}`);
      }
      const member = await membership(userId);
      const memberships = [...new Set(input.memberships)].sort();
      await Household.where({ id: member.householdId }).update({ memberships });
      return { memberships };
    },

    async updatePreferences(userId: string, input: UpdatePreferences): Promise<Preferences> {
      const member = await membership(userId);
      if (Object.keys(input).length > 0) {
        await Household.where({ id: member.householdId }).update(input);
      }
      return readPreferences(member.householdId);
    },

    /** Replaces the invite code, so the old one stops working. */
    async rotateInviteCode(userId: string): Promise<Household> {
      const member = await membership(userId);
      await Household.where({ id: member.householdId }).update({ inviteCode: newInviteCode() });
      return load(userId, member.householdId);
    },
  };
}

export type HouseholdService = ReturnType<typeof createHouseholdService>;
