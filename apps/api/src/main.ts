import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { requireEnv, env } from "./lib/env";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import helmet from "helmet";
import express from "express";

// 환경변수 검증 (애플리케이션 시작 전)
requireEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 예외 필터 적용
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Helmet 보안 헤더 설정
  app.use(helmet());

  // CORS 설정
  app.enableCors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24시간
  });

  // Request Size 제한 (10MB)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Trust Proxy 설정 (프로덕션 환경에서 리버스 프록시 사용 시)
  if (env.isProduction) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set("trust proxy", 1);
  }

  const port = env.PORT;
  await app.listen(port);
  console.log(`🚀 API 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📝 환경: ${env.NODE_ENV}`);
  console.log(`🌐 프론트엔드 URL: ${env.FRONTEND_URL}`);
}

bootstrap();
