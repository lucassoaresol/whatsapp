-- up
CREATE TABLE "votes" (
  "id" SERIAL NOT NULL,
  "selected_name" TEXT NOT NULL,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  CONSTRAINT "votes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "votes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "votes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "votes";
