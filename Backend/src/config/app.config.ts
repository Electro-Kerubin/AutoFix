import { registerAs } from '@nestjs/config';
import { resolve } from 'node:path';

const bool = (valor: string | undefined, porDefecto: boolean): boolean =>
  valor === undefined ? porDefecto : ['1', 'true', 'yes', 'si'].includes(valor.toLowerCase());

const DEV_JWT_SECRET = 'dev-only-secret-no-usar-en-produccion-0123456789';

export const appConfig = registerAs('app', () => {
  const env = process.env;
  const nodeEnv = env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';

  if (isProd && (env.JWT_SECRET ?? '').length < 32) {
    throw new Error('JWT_SECRET es obligatorio en producción y debe tener al menos 32 caracteres');
  }
  if (isProd && !env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD es obligatorio en producción');
  }

  return {
    nodeEnv,
    isProd,
    port: Number(env.PORT ?? 3000),
    /** Orígenes permitidos (separados por coma). En producción el sistema es same-origin: vacío = sin CORS. */
    corsOrigin: env.CORS_ORIGIN ?? (isProd ? '' : 'http://localhost:4200'),
    /** Activar cuando haya un proxy/balanceador delante, para que `req.ip` sea la IP real del cliente. */
    trustProxy: bool(env.TRUST_PROXY, false),
    /** URL pública del sistema; se usa para armar los links del portal cliente. */
    publicUrl: (env.PUBLIC_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
    uploadsDir: resolve(env.UPLOADS_DIR ?? 'uploads'),
    frontendDist: resolve(env.FRONTEND_DIST ?? '../Frontend/dist/autofix-frontend/browser'),
    seedOnBoot: bool(env.SEED_ON_BOOT, !isProd),
    /** Tareas periódicas (cola de sincronización, recordatorios). Desactivar en réplicas que sólo atienden HTTP. */
    workersEnabled: bool(env.WORKERS_ENABLED, true),
    jwt: {
      secret: env.JWT_SECRET || DEV_JWT_SECRET,
      expiresInSeconds: Number(env.JWT_EXPIRES_IN_SECONDS ?? 10 * 60 * 60),
    },
    db: {
      host: env.DB_HOST ?? 'localhost',
      port: Number(env.DB_PORT ?? 5432),
      user: env.DB_USER ?? 'autofix',
      password: env.DB_PASSWORD ?? 'autofix_dev',
      name: env.DB_NAME ?? 'autofix',
      ssl: bool(env.DB_SSL, false),
      /** Sólo para desarrollo: en producción el esquema se maneja con migraciones. */
      synchronize: bool(env.DB_SYNC, !isProd),
      migrationsRun: bool(env.DB_MIGRATIONS_RUN, isProd),
    },
    erp: {
      baseUrl: (env.ERP_BASE_URL ?? '').replace(/\/$/, ''),
      apiKey: env.ERP_API_KEY ?? '',
    },
    inventario: {
      baseUrl: (env.INVENTARIO_BASE_URL ?? '').replace(/\/$/, ''),
      apiKey: env.INVENTARIO_API_KEY ?? '',
    },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
