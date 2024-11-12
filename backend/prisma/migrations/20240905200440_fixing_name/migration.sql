/*
  Warnings:

  - You are about to drop the column `piority` on the `task_queue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "task_queue" DROP COLUMN "piority",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
