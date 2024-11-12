-- CreateTable
CREATE TABLE "dislikes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dislikes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dislikes_user_id_idx" ON "dislikes"("user_id");

-- CreateIndex
CREATE INDEX "dislikes_bot_id_idx" ON "dislikes"("bot_id");

-- AddForeignKey
ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
