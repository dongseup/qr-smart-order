-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "orderNo" DROP DEFAULT;
DROP SEQUENCE "orders_orderno_seq";
