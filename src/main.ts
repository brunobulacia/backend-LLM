import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PublicationLogger } from './utils/publication-logger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  const publicPath = join(__dirname, '..', 'public');
  console.log('Buscando archivos estáticos en:', publicPath);
  app.use(express.static(publicPath));

  PublicationLogger.test();

  await app.listen(process.env.PORT ?? 8080);
  console.log(`Servidor corriendo en puerto ${process.env.PORT ?? 8080}`);
}
bootstrap();
