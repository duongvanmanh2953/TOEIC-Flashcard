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
  const logger = new Logger('KidApiBootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  const port = process.env.KID_PORT || process.env.PORT || 4100;
  const clientUrl = process.env.KID_CLIENT_URL || 'http://localhost:3100';

  // Root Health Check & Service info endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.status(200).json({
      name: 'LetStuN Kid API',
      service: 'letstun-kid-api',
      status: 'UP',
      health: '/health',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    });
  });
  expressApp.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'UP', service: 'letstun-kid-api', timestamp: new Date().toISOString() });
  });

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

  // Register Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS specifically for Kid Frontend
  const allowedOrigins = [
    clientUrl,
    'https://kid.letstun.site',
    'https://letstun.site',
    'http://localhost:3100',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('letstun.site')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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
    .setTitle('LetStuN Kid API')
    .setDescription('Dedicated Backend API for LetStuN Kid & Games Ecosystem')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Kid Learning & Gamification')
    .addTag('Game Assets Manifest & Resources')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 LetStuN Kid API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
