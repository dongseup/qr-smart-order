/**
 * Supabase 연결 디버깅 스크립트
 *
 * 실행 방법:
 * npx ts-node src/debug-supabase.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { env, requireEnv } from "./lib/env";

async function main() {
  requireEnv();

  console.log("🔍 Supabase 연결 디버깅 시작\n");
  console.log("=".repeat(60));
  console.log("");

  // 1. 환경변수 확인
  console.log("1. 환경변수 확인");
  console.log(`   SUPABASE_URL: ${env.SUPABASE_URL ? "✅ 설정됨" : "❌ 누락"}`);
  if (env.SUPABASE_URL) {
    console.log(`   URL: ${env.SUPABASE_URL.substring(0, 30)}...`);
  }
  console.log(
    `   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? "✅ 설정됨" : "❌ 누락"}`
  );
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const keyPreview = env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "...";
    console.log(`   Key (미리보기): ${keyPreview}`);
    console.log(`   Key 길이: ${env.SUPABASE_SERVICE_ROLE_KEY.length} 문자`);

    // JWT 형식 확인
    if (env.SUPABASE_SERVICE_ROLE_KEY.startsWith("eyJ")) {
      console.log(`   Key 형식: ✅ JWT 형식 (올바름)`);
    } else {
      console.log(`   Key 형식: ⚠️ JWT 형식이 아님 (잘못된 키일 수 있음)`);
    }
  }
  console.log("");

  // 2. Supabase 클라이언트 생성
  console.log("2. Supabase 클라이언트 생성");
  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    console.log("   ✅ 클라이언트 생성 성공");
    console.log("");

    // 3. 연결 테스트
    console.log("3. 데이터베이스 연결 테스트");
    const { data, error } = await supabase.from("menus").select("id").limit(1);

    if (error) {
      console.log(`   ❌ 연결 실패: ${error.message}`);
      console.log(`   에러 코드: ${error.code || "N/A"}`);
      console.log(`   에러 상세: ${JSON.stringify(error, null, 2)}`);
      console.log("");

      // 에러 타입별 해결 방법 제시
      if (error.message.includes("permission denied")) {
        console.log("💡 권한 오류 해결 방법:");
        console.log("");
        console.log("   ⚠️  테이블 권한 문제입니다. 다음 단계를 따라주세요:");
        console.log("");
        console.log("   1. Supabase 대시보드 → SQL Editor로 이동");
        console.log(
          "   2. fix-supabase-permissions.sql 파일의 내용을 복사하여 실행"
        );
        console.log("   3. 또는 다음 SQL을 직접 실행:");
        console.log("");
        console.log(
          "      GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;"
        );
        console.log(
          "      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.menus TO service_role;"
        );
        console.log(
          "      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO service_role;"
        );
        console.log(
          "      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO service_role;"
        );
        console.log("");
        console.log("   4. 권한 부여 후 다시 테스트:");
        console.log("      npm run debug:supabase");
        console.log("");
        console.log(
          "   📝 참고: Prisma는 직접 DB에 연결하므로 정상 작동합니다."
        );
        console.log(
          "      Supabase 클라이언트는 PostgREST API를 통해 접근하므로"
        );
        console.log("      테이블 권한이 필요합니다.");
      } else if (error.message.includes("Invalid API key")) {
        console.log("💡 API 키 오류 해결 방법:");
        console.log("   1. SUPABASE_SERVICE_ROLE_KEY가 올바른지 확인");
        console.log("   2. anon key가 아닌 service_role key를 사용하는지 확인");
      } else if (
        error.message.includes("relation") ||
        error.message.includes("does not exist")
      ) {
        console.log("💡 테이블 오류 해결 방법:");
        console.log("   1. Prisma 마이그레이션이 실행되었는지 확인");
        console.log("   2. Supabase 대시보드에서 테이블이 생성되었는지 확인");
      }
    } else {
      console.log(`   ✅ 연결 성공!`);
      console.log(`   조회된 데이터: ${data ? `${data.length}개` : "없음"}`);
    }
  } catch (error: any) {
    console.log(`   ❌ 클라이언트 생성 실패: ${error.message}`);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("");

  // 4. Prisma와 비교
  console.log("4. Prisma 연결 상태 비교");
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("   ✅ Prisma 연결: 정상");
    await prisma.$disconnect();
  } catch (error: any) {
    console.log(`   ❌ Prisma 연결 실패: ${error.message}`);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("");
}

main().catch((error) => {
  console.error("❌ 스크립트 실행 중 오류:", error);
  process.exit(1);
});
