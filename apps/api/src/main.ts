import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 4000;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

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
    .setTitle('VocabFlow AI API')
    .setDescription('Production-ready API for VocabFlow AI: Spaced Repetition, Adaptive Learning, Vocabulary Explorer & AI Tutor')
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

  await app.listen(port);
  logger.log(`🚀 VocabFlow API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
