-- up
CREATE TABLE "votes" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "selected_name" TEXT NOT NULL,
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "chat_id" INTEGER NOT NULL,
  CONSTRAINT "votes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "clients_chats" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "votes";
