-- CreateTable
CREATE TABLE "SessionCreationChannel" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT '%emoji% %name%',
    "fallbackName" TEXT NOT NULL DEFAULT 'Lounge',
    "usePresence" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionCreationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSessionChannel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "sessionCreationChannelId" TEXT,

    CONSTRAINT "VoiceSessionChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionCreationChannel_id_key" ON "SessionCreationChannel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceSessionChannel_id_key" ON "VoiceSessionChannel"("id");

-- AddForeignKey
ALTER TABLE "VoiceSessionChannel" ADD CONSTRAINT "VoiceSessionChannel_sessionCreationChannelId_fkey" FOREIGN KEY ("sessionCreationChannelId") REFERENCES "SessionCreationChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
