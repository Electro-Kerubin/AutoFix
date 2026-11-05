import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { appConfig } from '../config/app.config';

/**
 * DataSource para el CLI de TypeORM (migraciones). Trabaja sobre el código compilado (dist/):
 *   npm run migration:generate -- src/database/migrations/NombreCambio
 *   npm run migration:run
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Sin .env: se usan las variables del entorno (producción).
}

const { db } = appConfig();

export default new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.user,
  password: db.password,
  database: db.name,
  ssl: db.ssl ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, '..', '**', '*.entity.js')],
  migrations: [join(__dirname, 'migrations', '*.js')],
});
