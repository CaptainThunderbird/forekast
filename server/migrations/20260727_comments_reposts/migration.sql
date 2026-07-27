CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reposts" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    CONSTRAINT "reposts_pkey" PRIMARY KEY ("userId", "forecastId")
);

CREATE INDEX "comments_forecastId_createdAt_idx" ON "comments"("forecastId", "createdAt");
CREATE INDEX "comments_userId_createdAt_idx" ON "comments"("userId", "createdAt");
CREATE INDEX "reposts_forecastId_idx" ON "reposts"("forecastId");

ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reposts" ADD CONSTRAINT "reposts_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
