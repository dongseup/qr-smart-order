// 간단한 API 테스트
const orderId = 'b09ce8e8-aad9-4d97-8966-7110369079a8';
const url = `http://localhost:3001/orders/${orderId}/status`;

const body = { status: 'COMPLETED' };

console.log('요청 URL:', url);
console.log('요청 Body:', JSON.stringify(body));

try {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('응답 상태:', response.status, response.statusText);
  const data = await response.json();
  console.log('응답 데이터:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('에러:', error.message);
}
