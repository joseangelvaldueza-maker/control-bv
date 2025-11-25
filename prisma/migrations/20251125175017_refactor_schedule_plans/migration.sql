/*
  Warnings:

  - You are about to drop the `WorkSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WorkSchedule" DROP CONSTRAINT "WorkSchedule_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "schedulePlanId" INTEGER;

-- DropTable
DROP TABLE "WorkSchedule";

-- CreateTable
CREATE TABLE "SchedulePlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SchedulePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePlanDay" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SchedulePlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePlanDay_planId_dayOfWeek_key" ON "SchedulePlanDay"("planId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanDay" ADD CONSTRAINT "SchedulePlanDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SchedulePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
