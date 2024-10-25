-- up
CREATE TABLE "medias" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "mime_type" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "is_down" BOOLEAN NOT NULL DEFAULT false
);

-- down
DROP TABLE "medias";
