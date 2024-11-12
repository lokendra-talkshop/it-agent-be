/*
  Warnings:

  - You are about to drop the column `message_id` on the `agent_tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "agent_tasks" DROP CONSTRAINT "agent_tasks_message_id_fkey";

-- AlterTable
ALTER TABLE "agent_tasks" DROP COLUMN "message_id";

-- CreateTable
CREATE TABLE "agent_memory" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "agent_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "root_id" TEXT,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_memory_plan_id_key_idx" ON "agent_memory"("plan_id", "key");

-- CreateIndex
CREATE INDEX "agent_memory_plan_id_idx" ON "agent_memory"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_root_id_key" ON "plan"("root_id");

-- CreateIndex
CREATE INDEX "plan_conversation_id_idx" ON "plan"("conversation_id");

-- AddForeignKey
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan" ADD CONSTRAINT "plan_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan" ADD CONSTRAINT "plan_root_id_fkey" FOREIGN KEY ("root_id") REFERENCES "agent_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
