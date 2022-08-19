/*
  Warnings:

  - Made the column `guildId` on table `SessionCreationChannel` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SessionCreationChannel" DROP CONSTRAINT "SessionCreationChannel_guildId_fkey";

-- AlterTable
ALTER TABLE "SessionCreationChannel" ALTER COLUMN "guildId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SessionCreationChannel" ADD CONSTRAINT "SessionCreationChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
