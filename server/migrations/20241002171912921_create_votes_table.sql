-- up
CREATE TABLE "votes" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "selected_name" TEXT NOT NULL,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "chat_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "votes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "clients_chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "votes";
