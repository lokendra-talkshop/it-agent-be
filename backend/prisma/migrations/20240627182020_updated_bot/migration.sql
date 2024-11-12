-- AlterTable
ALTER TABLE "bots" ADD COLUMN     "description" VARCHAR(800),
ALTER COLUMN "config_location" SET DEFAULT '';

-- AlterTable
ALTER TABLE "presigned_urls" ALTER COLUMN "bucket" SET DEFAULT 'role-play-bot-user-images';
