/**
 * WebSocket Gateway 테스트 스크립트
 * 
 * 사용법:
 *   ts-node src/test-websocket.ts
 */

import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.API_URL || "http://localhost:3001";

console.log("🔌 WebSocket 테스트 시작");
console.log(`서버 URL: ${SERVER_URL}\n`);

// Socket.io 클라이언트 생성
const socket: Socket = io(SERVER_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// 연결 이벤트
socket.on("connect", () => {
  console.log("✅ 서버에 연결되었습니다.");
  console.log(`   Socket ID: ${socket.id}\n`);

  // 테스트 시나리오 실행
  runTestScenario();
});

// 연결 해제 이벤트
socket.on("disconnect", (reason) => {
  console.log(`\n⚠️ 연결 해제: ${reason}`);
});

// 조인 성공 이벤트 (kitchen 룸)
socket.on("Join_room_success", (data) => {
  if (data.roomType === "kitchen") {
    console.log("✅ kitchen 룸 조인 성공:");
    console.log(`   ${JSON.stringify(data, null, 2)}\n`);
  }
});

// 조인 성공 이벤트 (order 룸)
socket.on("join_room_success", (data) => {
  if (data.roomType === "order") {
    console.log("✅ order 룸 조인 성공:");
    console.log(`   ${JSON.stringify(data, null, 2)}\n`);
  }
});

// 나가기 성공 이벤트
socket.on("leave_room_success", (data) => {
  if (data.roomType === "kitchen") {
    console.log("✅ kitchen 룸 나가기 성공:");
  } else if (data.roomType === "order") {
    console.log("✅ order 룸 나가기 성공:");
  }
  console.log(`   ${JSON.stringify(data, null, 2)}\n`);
});

// 에러 이벤트
socket.on("error", (error) => {
  console.error("❌ 에러 발생:");
  console.error(`   ${JSON.stringify(error, null, 2)}\n`);
});

// 연결 에러
socket.on("connect_error", (error) => {
  console.error("❌ 연결 실패:");
  console.error(`   ${error.message}\n`);
  console.log("💡 서버가 실행 중인지 확인하세요: npm run dev");
  process.exit(1);
});

/**
 * 테스트 시나리오 실행
 */
async function runTestScenario() {
  console.log("📋 테스트 시나리오 시작\n");

  try {
    // 테스트 1: kitchen 룸 조인
    console.log("테스트 1: kitchen 룸 조인");
    socket.emit("join_kitchen", { roomType: "kitchen" });
    await sleep(1000);

    // 테스트 2: 잘못된 요청 (에러 처리 확인)
    console.log("테스트 2: 잘못된 요청 (에러 처리 확인)");
    socket.emit("join_kitchen", { roomType: "invalid" });
    await sleep(1000);

    // 테스트 3: kitchen 룸 나가기
    console.log("테스트 3: kitchen 룸 나가기");
    socket.emit("leave_room", { roomType: "kitchen" });
    await sleep(1000);

    // 테스트 4: kitchen 룸 재조인
    console.log("테스트 4: kitchen 룸 재조인");
    socket.emit("join_kitchen", { roomType: "kitchen" });
    await sleep(1000);

    // 테스트 5: order 룸 조인 (orderId 포함)
    console.log("테스트 5: order 룸 조인 (orderId 포함)");
    const testOrderId1 = "550e8400-e29b-41d4-a716-446655440000";
    socket.emit("join_kitchen", { 
      roomType: "order", 
      orderId: testOrderId1 
    });
    await sleep(1000);

    // 테스트 6: order 룸 조인 실패 (orderId 없음)
    console.log("테스트 6: order 룸 조인 실패 (orderId 없음)");
    socket.emit("join_kitchen", { roomType: "order" });
    await sleep(1000);

    // 테스트 7: 여러 order 룸 조인 (한 클라이언트가 여러 주문 룸에 참여)
    console.log("테스트 7: 여러 order 룸 조인");
    const testOrderId2 = "660e8400-e29b-41d4-a716-446655440001";
    socket.emit("join_kitchen", { 
      roomType: "order", 
      orderId: testOrderId2 
    });
    await sleep(1000);

    // 테스트 8: 첫 번째 order 룸 나가기
    console.log("테스트 8: 첫 번째 order 룸 나가기");
    socket.emit("leave_room", { 
      roomType: "order", 
      orderId: testOrderId1 
    });
    await sleep(1000);

    // 테스트 9: 두 번째 order 룸 나가기
    console.log("테스트 9: 두 번째 order 룸 나가기");
    socket.emit("leave_room", { 
      roomType: "order", 
      orderId: testOrderId2 
    });
    await sleep(1000);

    // 테스트 10: order 룸 나가기 실패 (orderId 없음)
    console.log("테스트 10: order 룸 나가기 실패 (orderId 없음)");
    socket.emit("leave_room", { roomType: "order" });
    await sleep(1000);

    // 테스트 11: 연결 해제 (자동 제거 확인)
    console.log("테스트 11: 연결 해제 (자동 제거 확인)");
    console.log("   3초 후 연결을 해제합니다...\n");
    await sleep(3000);

    socket.disconnect();
    console.log("✅ 모든 테스트 완료");
    process.exit(0);
  } catch (error) {
    console.error("❌ 테스트 중 에러 발생:", error);
    socket.disconnect();
    process.exit(1);
  }
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
  socket.disconnect();
  process.exit(0);
});
