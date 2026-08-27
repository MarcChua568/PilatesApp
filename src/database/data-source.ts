import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate / run / revert)
 * and for direct injection in capacity.service.ts. The NestJS runtime builds its
 * own connection via TypeOrmModule.forRootAsync in app.module.ts.
 *
 * DATABASE_URL is read from .env (or the environment) — override it inline to
 * target the test database, e.g.:
 *   DATABASE_URL=$TEST_DATABASE_URL npm run migration:run
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
