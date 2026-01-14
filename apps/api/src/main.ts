import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { requireEnv, env } from './lib/env';

// 환경변수 검증 (애플리케이션 시작 전)
requireEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 설정
  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  const port = env.PORT;
  await app.listen(port);
  console.log(`🚀 API 서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`📝 환경: ${env.NODE_ENV}`);
  console.log(`🌐 프론트엔드 URL: ${env.FRONTEND_URL}`);
}

bootstrap();
