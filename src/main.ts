import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 请求体大小限制，防止大 payload 攻击
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'"],
          connectSrc: [
            "'self'",
            // 允许 GitHub API（仓库模块需要）
            "https://api.github.com",
            // 开发时 Vite HMR WebSocket
            ...(process.env.NODE_ENV === "development"
              ? ["ws://localhost:*"]
              : []),
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174'
  ).split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 优雅关闭
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 Backend running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
