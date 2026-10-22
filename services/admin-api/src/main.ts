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
  const logger = new Logger('AdminApiBootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit for batch asset imports & updates
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  const port = process.env.ADMIN_PORT || process.env.PORT || 4200;
  const clientUrl = process.env.ADMIN_CLIENT_URL || 'http://localhost:3200';

  // Root Health Check & Service info endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (_req: any, res: any) => {
    res.status(200).json({
      name: 'LetStuN Admin API',
      service: 'letstun-admin-api',
      status: 'UP',
      health: '/health',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    });
  });
  expressApp.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'UP', service: 'letstun-admin-api', timestamp: new Date().toISOString() });
  });

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

  // Register Global Exception Filter for standardized errors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS specifically for Admin Frontend
  const allowedOrigins = [
    clientUrl,
    'https://admin.vocalflow.site',
    'https://vocalflow.site',
    'http://localhost:3200',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('vocalflow.site')) {
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
    .setTitle('LetStuN Admin API')
    .setDescription('Dedicated Control Center & Governance API for LetStuN Admins')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Admin Command Center')
    .addTag('Admin Asset Management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 LetStuN Admin API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
