/*
  Warnings:

  - Added the required column `batch_create_time` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch_id` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch_type` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cover_url` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `create_type` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `download_url` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `has_voice` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model_id` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_id` to the `video_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `video_results` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "video_results" DROP CONSTRAINT "video_results_job_queue_id_fkey";

-- AlterTable
ALTER TABLE "video_results" ADD COLUMN     "batch_create_time" BIGINT NOT NULL,
ADD COLUMN     "batch_id" TEXT NOT NULL,
ADD COLUMN     "batch_type" INTEGER NOT NULL,
ADD COLUMN     "cover_url" TEXT NOT NULL,
ADD COLUMN     "create_type" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "download_url" TEXT NOT NULL,
ADD COLUMN     "extra" JSONB,
ADD COLUMN     "has_voice" BOOLEAN NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "model_id" TEXT NOT NULL,
ADD COLUMN     "prompt_img_url" TEXT,
ADD COLUMN     "status" INTEGER NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "video_id" TEXT NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL,
ALTER COLUMN "job_queue_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "video_results" ADD CONSTRAINT "video_results_job_queue_id_fkey" FOREIGN KEY ("job_queue_id") REFERENCES "queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
