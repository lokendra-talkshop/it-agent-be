-- CreateTable
CREATE TABLE "sample_prompts" (
    "id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sample_prompts_bot_id_idx" ON "sample_prompts"("bot_id");

-- AddForeignKey
ALTER TABLE "sample_prompts" ADD CONSTRAINT "sample_prompts_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
