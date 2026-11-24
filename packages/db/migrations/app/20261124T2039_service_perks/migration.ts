#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3fa41ba7d8d8b75f5f46f74be4237ffa7f75728a23a8a27317a5a0c75be3c057/contract';
import startContract from '../../snapshots/3fa41ba7d8d8b75f5f46f74be4237ffa7f75728a23a8a27317a5a0c75be3c057/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b3e22bcbaa098c4f05202bb2583419559af3b41070844c8f674186b1c61dbd2b/contract';
import endContract from '../../snapshots/b3e22bcbaa098c4f05202bb2583419559af3b41070844c8f674186b1c61dbd2b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('memberships', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Service',
        column: col('perkEndsOn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Service',
        column: col('perkPriceCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Service',
        column: col('perkVia', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Household',
        constraint: 'Household_memberships_elem_not_null_cee5b156',
        expression: sql`array_position("memberships", NULL) IS NULL`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
