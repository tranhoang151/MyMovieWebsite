-- AlterTable
ALTER TABLE "movies" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "episodes" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "movies_views_idx" ON "movies"("views" DESC);
