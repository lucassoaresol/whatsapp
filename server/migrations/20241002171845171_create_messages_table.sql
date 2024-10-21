-- up
CREATE TABLE "messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "from_me" BOOLEAN NOT NULL DEFAULT false,
  "status_id" INT NOT NULL,
  "chat_id" INTEGER NOT NULL,
  "from_id" TEXT,
  "media_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "clients_chats" ("key") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "medias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON "messages"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_messages_updated_at ON "messages";

DROP TABLE "messages";
