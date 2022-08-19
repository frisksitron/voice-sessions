/*
  Warnings:

  - Added the required column `userId` to the `UserSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserSession_id_key";

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "userId" TEXT NOT NULL;
