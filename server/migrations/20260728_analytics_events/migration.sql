CREATE TABLE "analytics_events" (
  "id" TEXT NOT NULL,
  "eventName" VARCHAR(64) NOT NULL,
  "userId" TEXT,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_eventName_createdAt_idx"
  ON "analytics_events"("eventName", "createdAt");
CREATE INDEX "analytics_events_userId_createdAt_idx"
  ON "analytics_events"("userId", "createdAt");

ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
