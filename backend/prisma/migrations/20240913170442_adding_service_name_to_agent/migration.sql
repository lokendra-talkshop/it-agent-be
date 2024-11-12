-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "service" VARCHAR(20);

-- CreateIndex
CREATE INDEX "agents_bot_id_idx" ON "agents"("bot_id");

-- CreateIndex
CREATE INDEX "agents_service_idx" ON "agents"("service");
