-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "generated_times" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "generate_times" SET DEFAULT 1;
