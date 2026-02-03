// 상태 전환 테스트
const orderId = 'b09ce8e8-aad9-4d97-8966-7110369079a8';
const baseUrl = 'http://localhost:3001';

async function updateStatus(status) {
  const url = `${baseUrl}/orders/${orderId}/status`;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`상태 변경 시도: ${status}`);
  console.log(`요청 URL: ${url}`);
  console.log(`요청 Body: ${JSON.stringify({ status })}`);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    console.log(`응답 상태: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log(`응답:`, JSON.stringify(data, null, 2));

    return response.ok;
  } catch (error) {
    console.error('에러:', error.message);
    return false;
  }
}

// 현재 상태 확인
console.log('현재 주문 상태 확인 중...');
const response = await fetch(`${baseUrl}/orders/${orderId}`);
const order = await response.json();
console.log(`현재 상태: ${order.data.status}`);

// PENDING → COOKING 시도
await updateStatus('COOKING');
