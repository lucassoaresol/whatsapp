-- up
CREATE TABLE "chats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "is_group" BOOLEAN NOT NULL DEFAULT false,
  "profile_pic_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON "chats"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_chats_updated_at ON "chats";

DROP TABLE "chats";
