/*
  Warnings:

  - You are about to drop the column `batch_create_time` on the `video_results` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Model" AS ENUM ('I2V_01_DIRECTOR', 'I2V_01_LIVE', 'I2V_01');

-- AlterTable
ALTER TABLE "queues" ADD COLUMN     "model" "Model";

-- AlterTable
ALTER TABLE "video_results" DROP COLUMN "batch_create_time";
