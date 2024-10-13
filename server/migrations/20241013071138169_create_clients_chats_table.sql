-- up
CREATE TABLE "clients_chats" (
  "key" SERIAL NOT NULL,
  "client_id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "unread_count" INTEGER NOT NULL,
  "date" TEXT NOT NULL,
  "date_display" TEXT NOT NULL,
  "hour" TEXT NOT NULL,
  "messages" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clients_chats_pkey" PRIMARY KEY ("client_id","chat_id"),
  CONSTRAINT "clients_chats_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "clients_chats_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "clients_chats";
