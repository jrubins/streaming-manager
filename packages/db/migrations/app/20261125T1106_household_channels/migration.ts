#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/466da3a433a5c3bad1dbd6d48c66c132f63d186f8d7ded134f88c5d71fe9924e/contract';
import endContract from '../../snapshots/466da3a433a5c3bad1dbd6d48c66c132f63d186f8d7ded134f88c5d71fe9924e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b3e22bcbaa098c4f05202bb2583419559af3b41070844c8f674186b1c61dbd2b/contract';
import startContract from '../../snapshots/b3e22bcbaa098c4f05202bb2583419559af3b41070844c8f674186b1c61dbd2b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Household',
        column: col('channels', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Household',
        constraint: 'Household_channels_elem_not_null_6ac6295a',
        expression: sql`array_position("channels", NULL) IS NULL`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
