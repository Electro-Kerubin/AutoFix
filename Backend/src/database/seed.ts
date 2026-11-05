import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

/** `npm run seed`: carga los datos de demostración si la base está vacía. */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const sembrado = await app.get(SeedService).sembrar();
  console.log(sembrado ? 'Datos de demostración cargados.' : 'La base ya tiene datos; no se hizo nada.');
  await app.close();
}

void main();
