#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4a77cc818b393af6590c68504ecc9005aca817a9cfacb3a9e5dee0ffdfeb83d7/contract';
import startContract from '../../snapshots/4a77cc818b393af6590c68504ecc9005aca817a9cfacb3a9e5dee0ffdfeb83d7/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d66c50f1ad3d9edd716db2f69f1e229877832c8c35121487a8f8e43df1253466/contract';
import endContract from '../../snapshots/d66c50f1ad3d9edd716db2f69f1e229877832c8c35121487a8f8e43df1253466/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Item',
        column: 'userId',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'Item',
        index: 'Item_userId_createdAt_idx_f726f04a',
        columns: ['userId', 'createdAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
