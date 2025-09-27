-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "mediaType" "public"."MediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "mediaUrl" TEXT NOT NULL DEFAULT '';
