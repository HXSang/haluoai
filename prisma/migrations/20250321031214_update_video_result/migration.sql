-- AlterTable
ALTER TABLE "video_results" ADD COLUMN     "is_marked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marked_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "video_results" ADD CONSTRAINT "video_results_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
