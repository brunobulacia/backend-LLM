import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PublicationLogger } from './utils/publication-logger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(express.static('public'));
  // Inicializar y testear el sistema de logging
  console.log('Inicializando sistema de logging...');
  PublicationLogger.test();

  await app.listen(process.env.PORT ?? 8080);
  console.log(`Servidor corriendo en puerto ${process.env.PORT ?? 8080}`);
}
bootstrap();
