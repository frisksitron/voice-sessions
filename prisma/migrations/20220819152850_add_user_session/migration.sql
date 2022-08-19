-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "voiceSessionChannelId" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_id_key" ON "UserSession"("id");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_voiceSessionChannelId_fkey" FOREIGN KEY ("voiceSessionChannelId") REFERENCES "VoiceSessionChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
