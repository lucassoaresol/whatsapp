-- up
CREATE TABLE "messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "from_me" BOOLEAN NOT NULL DEFAULT false,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "chat_id" INTEGER NOT NULL,
  "from_id" TEXT,
  "media_id" INTEGER,
  CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "clients_chats" ("key") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "medias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "messages";
