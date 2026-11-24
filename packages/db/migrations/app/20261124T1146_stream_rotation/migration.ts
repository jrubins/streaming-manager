#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2a05321a727abc4e4171019eeaff87c4011a4167d6fdadf0f35184c0307d836b/contract';
import endContract from '../../snapshots/2a05321a727abc4e4171019eeaff87c4011a4167d6fdadf0f35184c0307d836b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d66c50f1ad3d9edd716db2f69f1e229877832c8c35121487a8f8e43df1253466/contract';
import startContract from '../../snapshots/d66c50f1ad3d9edd716db2f69f1e229877832c8c35121487a8f8e43df1253466/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'Item' }),
      this.createTable({
        schema: 'public',
        table: 'Household',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('inviteCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', {
            notNull: true,
            default: lit('US'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'HouseholdMember',
        columns: [
          col('displayName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('householdId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('joinedAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['userId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Service',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('householdId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('logoPath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('monthlyPriceCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('planName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('priceSource', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('providerKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Service_priceSource_check_fb78c88b',
            sql`"priceSource" IN ('catalog', 'manual', 'invoice')`,
          ),
          checkExpression('Service_status_check_a6adec7a', sql`"status" IN ('active', 'paused')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'WatchlistShow',
        columns: [
          col('addedByUserId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('householdId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mediaType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('posterPath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('providerKeys', 'text[]', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('providersRefreshedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('providersRegion', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tmdbId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('watched', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('year', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'WatchlistShow_mediaType_check_adfa15b9',
            sql`"mediaType" IN ('tv', 'movie')`,
          ),
          checkExpression(
            'WatchlistShow_providerKeys_elem_not_null_be2500c5',
            sql`array_position("providerKeys", NULL) IS NULL`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Household',
        constraint: 'Household_inviteCode_key',
        columns: ['inviteCode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Service',
        constraint: 'Service_householdId_providerKey_key',
        columns: ['householdId', 'providerKey'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'WatchlistShow',
        constraint: 'WatchlistShow_householdId_mediaType_tmdbId_key',
        columns: ['householdId', 'mediaType', 'tmdbId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'HouseholdMember',
        index: 'HouseholdMember_householdId_idx_fb33d798',
        columns: ['householdId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'HouseholdMember',
        index: 'HouseholdMember_householdId_joinedAt_idx_9aa29de0',
        columns: ['householdId', 'joinedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Service',
        index: 'Service_householdId_idx_fb33d798',
        columns: ['householdId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'WatchlistShow',
        index: 'WatchlistShow_householdId_createdAt_idx_6b6c436d',
        columns: ['householdId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'WatchlistShow',
        index: 'WatchlistShow_householdId_idx_fb33d798',
        columns: ['householdId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'HouseholdMember',
        foreignKey: {
          name: 'HouseholdMember_householdId_fkey',
          columns: ['householdId'],
          references: { schema: 'public', table: 'Household', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Service',
        foreignKey: {
          name: 'Service_householdId_fkey',
          columns: ['householdId'],
          references: { schema: 'public', table: 'Household', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'WatchlistShow',
        foreignKey: {
          name: 'WatchlistShow_householdId_fkey',
          columns: ['householdId'],
          references: { schema: 'public', table: 'Household', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
