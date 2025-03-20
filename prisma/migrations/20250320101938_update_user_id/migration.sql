-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "user_id" INTEGER;

-- AlterTable
ALTER TABLE "video_results" ADD COLUMN     "creator_id" INTEGER;

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_results" ADD CONSTRAINT "video_results_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
