-- DropForeignKey
ALTER TABLE "queues" DROP CONSTRAINT "queues_account_id_fkey";

-- DropForeignKey
ALTER TABLE "video_results" DROP CONSTRAINT "video_results_account_id_fkey";

-- AlterTable
ALTER TABLE "queues" ALTER COLUMN "account_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "video_results" ALTER COLUMN "account_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_results" ADD CONSTRAINT "video_results_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
