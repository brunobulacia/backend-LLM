import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PublicationLogger } from './utils/publication-logger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Middleware para ngrok
  app.use((req, res, next) => {
    res.header('ngrok-skip-browser-warning', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://frontend-llm-two.vercel.app',
      'https://triter-poly-trace.ngrok-free.dev',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'ngrok-skip-browser-warning',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials',
    ],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 200,
  });

  const publicPath = join(__dirname, '..', 'public');
  console.log('Buscando archivos estáticos en:', publicPath);
  app.use(express.static(publicPath));

  PublicationLogger.test();

  await app.listen(process.env.PORT ?? 8080);
  console.log(`Servidor corriendo en puerto ${process.env.PORT ?? 8080}`);
}
bootstrap();
