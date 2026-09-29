import 'dotenv/config'; // ponytail: load env before module graph, otherwise ConfigService arrives too late for top-level process.env reads
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { CacheService } from './services/cache.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes — ValidationPipe với class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response transformer
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const port = process.env.PORT ?? 3001;

  // Swagger UI (dev only)
  const config = new DocumentBuilder()
    .setTitle('CineStream API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addTag('movies')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Verify Redis connectivity on startup (non-blocking)
  try {
    const cacheService = app.get(CacheService);
    const redisOk = await cacheService.ping();
    if (redisOk) {
      Logger.log('✅ Redis (Upstash) connection verified', 'Redis');
    } else {
      Logger.warn('❌ Redis (Upstash) connection failed — cache will be disabled', 'Redis');
    }
  } catch (err) {
    Logger.warn(`Redis startup verification skipped: ${err instanceof Error ? err.message : String(err)}`, 'Redis');
  }

  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();