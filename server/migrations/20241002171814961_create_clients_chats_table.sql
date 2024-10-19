-- up
CREATE TABLE "clients_chats" (
  "key" SERIAL NOT NULL UNIQUE,
  "client_id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "unread_count" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clients_chats_pkey" PRIMARY KEY ("client_id","chat_id"),
  CONSTRAINT "clients_chats_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "clients_chats_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER update_clients_chats_updated_at
BEFORE UPDATE ON "clients_chats"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_clients_chats_updated_at ON "clients_chats";

DROP TABLE "clients_chats";
