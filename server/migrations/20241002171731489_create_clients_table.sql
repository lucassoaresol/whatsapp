-- up
CREATE TABLE "clients" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_sync_at" TIMESTAMP(3)
);

-- down
DROP TABLE "clients";
