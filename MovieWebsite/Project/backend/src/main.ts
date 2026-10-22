import 'dotenv/config'; // load env before module graph
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { CacheService } from './services/cache.service';

const server: Express = express();
let nestApp: INestApplication | null = null;
let initPromise: Promise<INestApplication> | null = null;

export async function bootstrapNestApp(expressInstance: Express): Promise<INestApplication> {
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create(AppModule, adapter);

  // Security Headers via Helmet (OWASP A05)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  // Response Compression (Gzip / Deflate)
  app.use(compression());

  // CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như curl, postman, server-to-server)
      if (!origin) return callback(null, true);
      // Cho phép frontend url, mọi domain *.vercel.app và localhost
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes — ValidationPipe với class-validator (OWASP A08)
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

  // Swagger UI (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CineStream API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('movies')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

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

  await app.init();
  return app;
}

async function ensureAppInitialized(): Promise<INestApplication> {
  if (nestApp) return nestApp;
  if (!initPromise) {
    initPromise = bootstrapNestApp(server).then((app) => {
      nestApp = app;
      return app;
    });
  }
  return initPromise;
}

// 1. Export default handler cho Vercel Serverless Function invocations
export default async function handler(req: any, res: any) {
  await ensureAppInitialized();
  return server(req, res);
}

// 2. Lắng nghe HTTP port cho cả local development và long-running container service
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
ensureAppInitialized()
  .then(() => {
    server.listen(port, () => {
      console.log(`🚀 Backend running on http://localhost:${port}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
      }
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize NestJS application:', err);
  });
