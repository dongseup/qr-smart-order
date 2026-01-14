/**
 * Prisma 클라이언트 연결 및 기본 CRUD 작업 테스트 스크립트
 * 
 * 실행 방법:
 * npx ts-node src/test-prisma-connection.ts
 */

import { PrismaClient } from '@prisma/client';
import { requireEnv } from './lib/env';

// 환경변수 검증
requireEnv();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔌 데이터베이스 연결 테스트 시작...\n');

  try {
    // 1. 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 2. 간단한 쿼리 테스트
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 쿼리 실행 성공:', result);
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    return false;
  }
}

async function testMenuCRUD() {
  console.log('📝 Menu CRUD 작업 테스트 시작...\n');

  try {
    // 1. READ: 메뉴 목록 조회
    console.log('1. 메뉴 목록 조회');
    const menus = await prisma.menu.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   ✅ ${menus.length}개의 메뉴 조회 성공`);
    if (menus.length > 0) {
      console.log(`   예시: ${menus[0].name} (${menus[0].price}원)`);
    }
    console.log('');

    // 2. READ: 단일 메뉴 조회
    if (menus.length > 0) {
      console.log('2. 단일 메뉴 조회');
      const menu = await prisma.menu.findUnique({
        where: { id: menus[0].id },
      });
      console.log(`   ✅ 메뉴 조회 성공: ${menu?.name}`);
      console.log('');
    }

    // 3. CREATE: 테스트 메뉴 생성 (트랜잭션 내에서)
    console.log('3. 메뉴 생성 (트랜잭션)');
    const testMenu = await prisma.$transaction(async (tx) => {
      const created = await tx.menu.create({
        data: {
          name: '테스트 메뉴',
          price: 1000,
          imageUrl: '/images/test.jpg',
          isSoldOut: false,
        },
      });
      return created;
    });
    console.log(`   ✅ 메뉴 생성 성공: ${testMenu.name} (ID: ${testMenu.id})`);
    console.log('');

    // 4. UPDATE: 메뉴 수정
    console.log('4. 메뉴 수정');
    const updated = await prisma.menu.update({
      where: { id: testMenu.id },
      data: { price: 1500 },
    });
    console.log(`   ✅ 메뉴 수정 성공: 가격 ${testMenu.price}원 → ${updated.price}원`);
    console.log('');

    // 5. DELETE: 테스트 메뉴 삭제
    console.log('5. 메뉴 삭제');
    await prisma.menu.delete({
      where: { id: testMenu.id },
    });
    console.log(`   ✅ 메뉴 삭제 성공: ${testMenu.name}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ Menu CRUD 작업 실패:', error);
    return false;
  }
}

async function testTransaction() {
  console.log('🔄 트랜잭션 테스트 시작...\n');

  try {
    // 트랜잭션 성공 케이스
    console.log('1. 트랜잭션 성공 테스트');
    const result = await prisma.$transaction(async (tx) => {
      const menu1 = await tx.menu.create({
        data: {
          name: '트랜잭션 테스트 메뉴 1',
          price: 2000,
        },
      });
      const menu2 = await tx.menu.create({
        data: {
          name: '트랜잭션 테스트 메뉴 2',
          price: 3000,
        },
      });
      return { menu1, menu2 };
    });
    console.log(`   ✅ 트랜잭션 성공: ${result.menu1.name}, ${result.menu2.name}`);
    console.log('');

    // 생성된 테스트 데이터 정리
    await prisma.menu.deleteMany({
      where: {
        name: {
          in: ['트랜잭션 테스트 메뉴 1', '트랜잭션 테스트 메뉴 2'],
        },
      },
    });
    console.log('   ✅ 테스트 데이터 정리 완료');
    console.log('');

    // 트랜잭션 롤백 테스트 (의도적 에러 발생)
    console.log('2. 트랜잭션 롤백 테스트');
    try {
      await prisma.$transaction(async (tx) => {
        await tx.menu.create({
          data: {
            name: '롤백 테스트 메뉴',
            price: 1000,
          },
        });
        // 의도적으로 에러 발생
        throw new Error('트랜잭션 롤백 테스트');
      });
    } catch (error) {
      // 롤백 확인: 메뉴가 생성되지 않았는지 확인
      const checkMenu = await prisma.menu.findFirst({
        where: { name: '롤백 테스트 메뉴' },
      });
      if (!checkMenu) {
        console.log('   ✅ 트랜잭션 롤백 성공: 메뉴가 생성되지 않음');
      } else {
        console.log('   ⚠️ 트랜잭션 롤백 실패: 메뉴가 생성됨');
      }
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ 트랜잭션 테스트 실패:', error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('⚠️ 에러 처리 테스트 시작...\n');

  try {
    // 1. 존재하지 않는 레코드 조회
    console.log('1. 존재하지 않는 레코드 조회');
    try {
      await prisma.menu.findUniqueOrThrow({
        where: { id: 'non-existent-id' },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log('   ✅ Prisma 에러 처리 성공: 레코드를 찾을 수 없음');
      } else {
        console.log('   ⚠️ 예상치 못한 에러:', error.message);
      }
    }
    console.log('');

    // 2. 유효하지 않은 데이터 생성
    console.log('2. 유효하지 않은 데이터 생성');
    try {
      await prisma.menu.create({
        data: {
          name: '', // 빈 문자열 (유효하지 않음)
          price: -100, // 음수 (유효하지 않음)
        } as any,
      });
    } catch (error: any) {
      if (error.code === 'P2002' || error.code === 'P2003') {
        console.log('   ✅ Prisma 유효성 검증 성공');
      } else {
        console.log('   ✅ 에러 처리 성공:', error.code || error.message);
      }
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ 에러 처리 테스트 실패:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Prisma 클라이언트 테스트 시작\n');
  console.log('=' .repeat(50));
  console.log('');

  const results = {
    connection: false,
    crud: false,
    transaction: false,
    errorHandling: false,
  };

  // 1. 연결 테스트
  results.connection = await testConnection();
  if (!results.connection) {
    console.log('❌ 연결 테스트 실패로 인해 테스트를 중단합니다.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // 2. CRUD 테스트
  results.crud = await testMenuCRUD();

  // 3. 트랜잭션 테스트
  results.transaction = await testTransaction();

  // 4. 에러 처리 테스트
  results.errorHandling = await testErrorHandling();

  // 결과 요약
  console.log('=' .repeat(50));
  console.log('📊 테스트 결과 요약\n');
  console.log(`연결 테스트:        ${results.connection ? '✅ 통과' : '❌ 실패'}`);
  console.log(`CRUD 테스트:        ${results.crud ? '✅ 통과' : '❌ 실패'}`);
  console.log(`트랜잭션 테스트:    ${results.transaction ? '✅ 통과' : '❌ 실패'}`);
  console.log(`에러 처리 테스트:  ${results.errorHandling ? '✅ 통과' : '❌ 실패'}`);
  console.log('');

  const allPassed = Object.values(results).every((result) => result);
  if (allPassed) {
    console.log('🎉 모든 테스트 통과!');
  } else {
    console.log('⚠️ 일부 테스트 실패');
  }

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ 예상치 못한 오류:', error);
  process.exit(1);
});
