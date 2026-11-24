#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2a05321a727abc4e4171019eeaff87c4011a4167d6fdadf0f35184c0307d836b/contract';
import startContract from '../../snapshots/2a05321a727abc4e4171019eeaff87c4011a4167d6fdadf0f35184c0307d836b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3fa41ba7d8d8b75f5f46f74be4237ffa7f75728a23a8a27317a5a0c75be3c057/contract';
import endContract from '../../snapshots/3fa41ba7d8d8b75f5f46f74be4237ffa7f75728a23a8a27317a5a0c75be3c057/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('allowAds', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('minStreams', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('require4k', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('requireDownloads', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('suggestNewServices', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
