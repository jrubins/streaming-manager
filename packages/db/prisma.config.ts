// Prisma CLI configuration. DATABASE_URL is injected by dotenvx (see the `prisma` script)
// locally, and by the environment in CI and on deploy.
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL'] ?? '',
    },
  }),
});
