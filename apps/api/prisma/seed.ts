import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuData = [
  { name: '아메리카노', price: 4500, imageUrl: '/images/americano.jpg' },
  { name: '카페라떼', price: 5000, imageUrl: '/images/latte.jpg' },
  { name: '카푸치노', price: 5000, imageUrl: '/images/cappuccino.jpg' },
  { name: '바닐라라떼', price: 5500, imageUrl: '/images/vanilla_latte.jpg' },
  { name: '카라멜마끼아또', price: 5500, imageUrl: '/images/caramel_macchiato.jpg' },
];

async function main() {
  console.log('🌱 시드 데이터 생성을 시작합니다...');

  // 기존 메뉴 데이터 삭제 (선택사항)
  await prisma.menu.deleteMany();
  console.log('✅ 기존 메뉴 데이터를 삭제했습니다.');

  // 메뉴 데이터 생성
  for (const menu of menuData) {
    const created = await prisma.menu.create({
      data: menu,
    });
    console.log(`✅ 메뉴 생성: ${created.name} (${created.price}원)`);
  }

  console.log(`\n🎉 총 ${menuData.length}개의 메뉴가 생성되었습니다.`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
