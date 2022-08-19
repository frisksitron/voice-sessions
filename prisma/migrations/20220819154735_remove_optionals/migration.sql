/*
  Warnings:

  - Made the column `voiceSessionChannelId` on table `UserSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sessionCreationChannelId` on table `VoiceSessionChannel` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_voiceSessionChannelId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceSessionChannel" DROP CONSTRAINT "VoiceSessionChannel_sessionCreationChannelId_fkey";

-- AlterTable
ALTER TABLE "UserSession" ALTER COLUMN "voiceSessionChannelId" SET NOT NULL;

-- AlterTable
ALTER TABLE "VoiceSessionChannel" ALTER COLUMN "sessionCreationChannelId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "VoiceSessionChannel" ADD CONSTRAINT "VoiceSessionChannel_sessionCreationChannelId_fkey" FOREIGN KEY ("sessionCreationChannelId") REFERENCES "SessionCreationChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_voiceSessionChannelId_fkey" FOREIGN KEY ("voiceSessionChannelId") REFERENCES "VoiceSessionChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
