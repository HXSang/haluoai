/*
  Warnings:

  - You are about to drop the column `local_storage` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `session_storage` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "local_storage",
DROP COLUMN "session_storage";
