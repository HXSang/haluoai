/*
  Warnings:

  - The `model_id` column on the `queues` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "queues" DROP COLUMN "model_id",
ADD COLUMN     "model_id" TEXT;
