/*
  Warnings:

  - Added the required column `emisor` to the `Mensaje` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Emisor" AS ENUM ('USUARIO', 'LLM');

-- AlterTable
ALTER TABLE "Mensaje" ADD COLUMN     "emisor" "Emisor" NOT NULL;
