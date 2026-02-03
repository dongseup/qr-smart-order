#!/usr/bin/env node

/**
 * 주문 대기건 일괄 완료 처리 스크립트
 * 테스트/개발 중 쌓인 대기 주문들을 모두 COMPLETED 상태로 변경합니다.
 *
 * 사용법:
 *   node scripts/clear-orders.mjs
 *   npm run clear-orders
 */

import { createInterface } from 'readline';

// API URL 설정
const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * 사용자 확인을 위한 readline 인터페이스
 */
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

/**
 * 대기 중인 주문 목록 조회
 */
async function getPendingOrders() {
  try {
    const response = await fetch(
      `${API_URL}/orders?status=PENDING&status=COOKING&status=READY`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ 주문 목록 조회 실패:', error.message);
    throw error;
  }
}

/**
 * 주문 상태를 COMPLETED로 변경
 */
async function completeOrder(orderId) {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ 주문 ${orderId} 처리 실패:`, error.message);
    return null;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🧹 주문 대기건 일괄 완료 처리 스크립트');
  console.log('=====================================\n');

  // 1. 대기 중인 주문 조회
  console.log('📋 대기 중인 주문을 조회합니다...');
  const orders = await getPendingOrders();

  if (orders.length === 0) {
    console.log('✅ 처리할 대기 주문이 없습니다.');
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
    process.exit(0);
  }

  // 4. 일괄 처리
  console.log('\n🔄 주문을 처리합니다...\n');
  let successCount = 0;
  let failCount = 0;

  for (const order of orders) {
    const result = await completeOrder(order.id);
    if (result) {
      successCount++;
      console.log(`  ✅ 주문 #${order.orderNo} 완료 처리됨`);
    } else {
      failCount++;
      console.log(`  ❌ 주문 #${order.orderNo} 처리 실패`);
    }

    // API 부하 방지를 위한 짧은 대기
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 5. 결과 요약
  console.log('\n=====================================');
  console.log('📊 처리 결과:');
  console.log(`  ✅ 성공: ${successCount}건`);
  console.log(`  ❌ 실패: ${failCount}건`);
  console.log('=====================================\n');

  if (successCount > 0) {
    console.log('✨ 주문 정리가 완료되었습니다!');
  }
}

// 스크립트 실행
main().catch((error) => {
  console.error('\n❌ 스크립트 실행 중 오류 발생:', error);
  process.exit(1);
});
