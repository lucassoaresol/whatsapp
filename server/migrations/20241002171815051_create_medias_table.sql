-- up
CREATE TABLE "medias" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "mime_type" TEXT,
  "data" TEXT,
  "path" TEXT NOT NULL,
  "is_down" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_medias_updated_at
BEFORE UPDATE ON "medias"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_medias_updated_at ON "medias";

DROP TABLE "medias";
