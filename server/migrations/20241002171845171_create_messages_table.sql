-- up
CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "from_me" BOOLEAN NOT NULL DEFAULT false,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "messages";
