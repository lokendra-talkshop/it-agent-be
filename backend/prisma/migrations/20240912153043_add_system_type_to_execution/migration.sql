-- AlterTable
ALTER TABLE "agent_tasks" ADD COLUMN     "is_executed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan_state" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "system_step_type" VARCHAR(8) NOT NULL DEFAULT 'system1';
