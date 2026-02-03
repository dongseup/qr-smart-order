#!/usr/bin/env node

/**
 * 주문 대기건 일괄 완료 처리 스크립트 (데이터베이스 직접 접근)
 * Prisma를 사용하여 데이터베이스에서 직접 상태를 변경합니다.
 *
 * 사용법:
 *   node scripts/clear-orders-db.mjs
 */

import { PrismaClient } from '@prisma/client';
import { createInterface } from 'readline';

const prisma = new PrismaClient();

function askQuestion(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  console.log('🧹 주문 대기건 일괄 완료 처리 (DB 직접 접근)');
  console.log('=====================================\n');

  try {
    // 1. 대기 중인 주문 조회
    console.log('📋 대기 중인 주문을 조회합니다...');
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'COOKING', 'READY'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (orders.length === 0) {
      console.log('✅ 처리할 대기 주문이 없습니다.');
      await prisma.$disconnect();
      process.exit(0);
    }

    // 2. 주문 목록 표시
    console.log(`\n📦 총 ${orders.length}건의 대기 주문이 있습니다:\n`);
    orders.forEach((order, index) => {
      console.log(
        `  ${index + 1}. 주문 #${order.orderNo} - ${order.status} - ${order.totalPrice.toLocaleString()}원`
      );
    });

    // 3. 사용자 확인
    console.log('\n⚠️  이 주문들을 모두 COMPLETED 상태로 변경합니다.');
    const answer = await askQuestion('계속하시겠습니까? (yes/no): ');

    if (answer !== 'yes' && answer !== 'y') {
      console.log('❌ 작업이 취소되었습니다.');
      await prisma.$disconnect();
      process.exit(0);
    }

    // 4. 일괄 업데이트
    console.log('\n🔄 주문을 처리합니다...\n');

    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: orders.map((o) => o.id),
        },
      },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    console.log(`\n✅ ${result.count}건의 주문이 완료 처리되었습니다!`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
