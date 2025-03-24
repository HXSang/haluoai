-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "retry_times" INTEGER NOT NULL DEFAULT 0;
