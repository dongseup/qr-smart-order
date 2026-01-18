/**
 * WebSocket 부하 테스트 스크립트
 * 
 * 사용법:
 *   ts-node src/test-websocket-load.ts [클라이언트 수] [테스트 시간(초)]
 *   예: ts-node src/test-websocket-load.ts 20 30
 */

import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.API_URL || "http://localhost:3001";
const CLIENT_COUNT = parseInt(process.argv[2]) || 10;
const TEST_DURATION = parseInt(process.argv[3]) || 30; // 초 단위

console.log("🔌 WebSocket 부하 테스트 시작");
console.log(`서버 URL: ${SERVER_URL}`);
console.log(`클라이언트 수: ${CLIENT_COUNT}`);
console.log(`테스트 시간: ${TEST_DURATION}초\n`);

interface ClientStats {
  connected: boolean;
  messagesReceived: number;
  errors: number;
  startTime: number;
}

const clients: Socket[] = [];
const stats: Map<string, ClientStats> = new Map();
let totalMessages = 0;
let totalErrors = 0;

/**
 * 클라이언트 생성 및 연결
 */
function createClient(clientId: number): Promise<void> {
  return new Promise((resolve) => {
    const socket: Socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
    });

    const clientKey = `client-${clientId}`;
    stats.set(clientKey, {
      connected: false,
      messagesReceived: 0,
      errors: 0,
      startTime: Date.now(),
    });

    socket.on("connect", () => {
      const stat = stats.get(clientKey);
      if (stat) {
        stat.connected = true;
      }
      resolve();
    });

    socket.on("disconnect", () => {
      const stat = stats.get(clientKey);
      if (stat) {
        stat.connected = false;
      }
    });

    socket.on("heartbeat", () => {
      socket.emit("heartbeat_ack");
      const stat = stats.get(clientKey);
      if (stat) {
        stat.messagesReceived++;
        totalMessages++;
      }
    });

    socket.on("error", () => {
      const stat = stats.get(clientKey);
      if (stat) {
        stat.errors++;
        totalErrors++;
      }
    });

    socket.on("connect_error", () => {
      const stat = stats.get(clientKey);
      if (stat) {
        stat.errors++;
        totalErrors++;
      }
    });

    clients.push(socket);
  });
}

/**
 * 부하 테스트 실행
 */
async function runLoadTest() {
  console.log("📊 클라이언트 연결 중...\n");

  // 모든 클라이언트 연결
  const connectPromises = [];
  for (let i = 0; i < CLIENT_COUNT; i++) {
    connectPromises.push(createClient(i));
  }

  await Promise.all(connectPromises);

  const connectedCount = Array.from(stats.values()).filter((s) => s.connected).length;
  console.log(`✅ ${connectedCount}/${CLIENT_COUNT} 클라이언트 연결 완료\n`);

  // 룸 조인 테스트
  console.log("📋 룸 조인 테스트 시작...\n");
  clients.forEach((socket, index) => {
    if (index % 2 === 0) {
      // 짝수 클라이언트는 kitchen 룸
      socket.emit("join_kitchen", { roomType: "kitchen" });
    } else {
      // 홀수 클라이언트는 order 룸
      const orderId = `550e8400-e29b-41d4-a716-44665544000${index}`;
      socket.emit("join_kitchen", {
        roomType: "order",
        orderId: orderId,
      });
    }
  });

  await sleep(2000);

  // 테스트 실행
  console.log(`⏱️  ${TEST_DURATION}초간 부하 테스트 실행 중...\n`);
  const testStartTime = Date.now();
  const testEndTime = testStartTime + TEST_DURATION * 1000;

  // 주기적으로 이벤트 전송
  const eventInterval = setInterval(() => {
    clients.forEach((socket) => {
      if (socket.connected) {
        // 하트비트 응답은 자동으로 처리됨
        // 추가 이벤트 전송 (선택적)
      }
    });
  }, 1000);

  // 테스트 종료 대기
  await sleep(TEST_DURATION * 1000);
  clearInterval(eventInterval);

  // 결과 수집
  const finalStats = Array.from(stats.values());
  const stillConnected = finalStats.filter((s) => s.connected).length;
  const totalMessagesReceived = finalStats.reduce((sum, s) => sum + s.messagesReceived, 0);
  const totalErrorsCount = finalStats.reduce((sum, s) => sum + s.errors, 0);

  // 모든 클라이언트 연결 해제
  console.log("🔌 모든 클라이언트 연결 해제 중...\n");
  clients.forEach((socket) => {
    socket.disconnect();
  });

  await sleep(1000);

  // 결과 출력
  console.log("=".repeat(60));
  console.log("📊 부하 테스트 결과\n");
  console.log(`총 클라이언트 수: ${CLIENT_COUNT}`);
  console.log(`연결 유지: ${stillConnected}/${CLIENT_COUNT}`);
  console.log(`총 메시지 수신: ${totalMessagesReceived}`);
  console.log(`총 에러 수: ${totalErrorsCount}`);
  console.log(`테스트 시간: ${TEST_DURATION}초`);
  console.log(`평균 메시지/초: ${(totalMessagesReceived / TEST_DURATION).toFixed(2)}`);
  console.log("=".repeat(60));

  process.exit(0);
}

/**
 * 지연 함수
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 프로세스 종료 처리
process.on("SIGINT", () => {
  console.log("\n\n⚠️ 테스트 중단");
  clients.forEach((socket) => socket.disconnect());
  process.exit(0);
});

// 부하 테스트 실행
runLoadTest().catch((error) => {
  console.error("❌ 부하 테스트 중 에러 발생:", error);
  clients.forEach((socket) => socket.disconnect());
  process.exit(1);
});
