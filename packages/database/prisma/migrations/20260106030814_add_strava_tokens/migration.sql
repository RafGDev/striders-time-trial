-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stravaAccessToken" TEXT,
ADD COLUMN     "stravaRefreshToken" TEXT,
ADD COLUMN     "stravaTokenExpiresAt" TIMESTAMP(3);
