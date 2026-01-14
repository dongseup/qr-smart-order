/*
  Warnings:

  - Added the required column `updatedAt` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
CREATE SEQUENCE orders_orderno_seq;
ALTER TABLE "orders" ALTER COLUMN "orderNo" SET DEFAULT nextval('orders_orderno_seq');
ALTER SEQUENCE orders_orderno_seq OWNED BY "orders"."orderNo";

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
