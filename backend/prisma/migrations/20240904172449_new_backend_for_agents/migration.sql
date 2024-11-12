-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "message_type" TEXT;

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "bot_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_task_nodes" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_task_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tasks" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL DEFAULT '',
    "task_content" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_queue" (
    "id" TEXT NOT NULL,
    "converation_id" TEXT NOT NULL,
    "piority" INTEGER NOT NULL DEFAULT 0,
    "task_execution_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_task_nodes_child_id_key" ON "agent_task_nodes"("child_id");

-- CreateIndex
CREATE INDEX "agent_task_nodes_parent_id_idx" ON "agent_task_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "agent_task_nodes_child_id_idx" ON "agent_task_nodes"("child_id");

-- CreateIndex
CREATE INDEX "task_queue_converation_id_idx" ON "task_queue"("converation_id");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_task_nodes" ADD CONSTRAINT "agent_task_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "agent_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_task_nodes" ADD CONSTRAINT "agent_task_nodes_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "agent_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_converation_id_fkey" FOREIGN KEY ("converation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_task_execution_id_fkey" FOREIGN KEY ("task_execution_id") REFERENCES "agent_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
