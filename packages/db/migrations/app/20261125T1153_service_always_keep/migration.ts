#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/466da3a433a5c3bad1dbd6d48c66c132f63d186f8d7ded134f88c5d71fe9924e/contract';
import startContract from '../../snapshots/466da3a433a5c3bad1dbd6d48c66c132f63d186f8d7ded134f88c5d71fe9924e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8f553b5e33b5c1ed83e19b140ff3ea0efe71c80c2e742b982c83c41dbe76d781/contract';
import endContract from '../../snapshots/8f553b5e33b5c1ed83e19b140ff3ea0efe71c80c2e742b982c83c41dbe76d781/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Service',
        column: col('alwaysKeep', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
