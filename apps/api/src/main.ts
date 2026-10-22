import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Automatically locate and load unified root .env
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const envFile of possibleEnvPaths) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


import { json, urlencoded } from 'express';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for batch imports up to 100MB
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  const port = process.env.PORT || 4000;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  // Serve game assets statically with 1-year immutable cache
  const express = require('express');
  const possibleGameAssetsPaths = [
    path.resolve(__dirname, '../public/game-assets'),
    path.resolve(__dirname, '../../public/game-assets'),
    path.resolve(process.cwd(), 'apps/api/public/game-assets'),
    path.resolve(process.cwd(), 'apps/web/public/game-assets'),
  ];
  for (const p of possibleGameAssetsPaths) {
    if (fs.existsSync(p)) {
      app.use('/game-assets', express.static(p, {
        maxAge: '1y',
        immutable: true,
      }));
      break;
    }
  }

  // Also serve kid assets if requested
  const possibleKidPaths = [
    path.resolve(process.cwd(), 'apps/web/public/kid'),
    path.resolve(__dirname, '../../web/public/kid'),
    path.resolve(__dirname, '../../../apps/web/public/kid'),
    path.resolve(process.cwd(), 'public/kid'),
  ];
  for (const kp of possibleKidPaths) {
    if (fs.existsSync(kp)) {
      app.use('/kid', express.static(kp, {
        maxAge: '1y',
        immutable: true,
      }));
      break;
    }
  }

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

  // Register Global Exception Filter for standardized Vietnamese errors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS
  app.enableCors({
    origin: [clientUrl, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('LetStuN AI API')
    .setDescription('Production-ready API for LetStuN AI: Spaced Repetition, Adaptive Learning, Vocabulary Explorer & AI Tutor')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Placement Test & Onboarding')
    .addTag('Dashboard & Analytics')
    .addTag('Vocabulary')
    .addTag('Smart Review Engine')
    .addTag('AI Vocabulary Assistant')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 LetStuN API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
