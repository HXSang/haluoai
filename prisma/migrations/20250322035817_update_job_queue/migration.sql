/*
  Warnings:

  - You are about to drop the column `model` on the `queues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "queues" DROP COLUMN "model",
ADD COLUMN     "model_id" "Model";
