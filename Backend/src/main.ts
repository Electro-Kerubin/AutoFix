import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Las evidencias se muestran como blob: (se descargan con el JWT y se pintan en <img>).
          'img-src': ["'self'", 'data:', 'blob:'],
        },
      },
    }),
  );
  if (config.corsOrigin) app.enableCors({ origin: config.corsOrigin.split(',').map((o) => o.trim()) });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  if (!config.isProd) {
    const documento = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('SUGO – AutoFix').setVersion('1.0').addBearerAuth().build(),
    );
    SwaggerModule.setup('api/docs', app, documento);
  }

  await app.listen(config.port);
  new Logger('Bootstrap').log(`SUGO escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
}

void bootstrap();
