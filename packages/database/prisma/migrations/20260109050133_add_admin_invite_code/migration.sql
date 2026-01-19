/*
  Warnings:

  - A unique constraint covering the columns `[adminInviteCode]` on the table `clubs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `adminInviteCode` to the `clubs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "adminInviteCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clubs_adminInviteCode_key" ON "clubs"("adminInviteCode");
