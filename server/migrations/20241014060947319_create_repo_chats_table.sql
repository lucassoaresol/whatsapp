-- up
CREATE TABLE "repo_chats" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "is_sync" BOOLEAN NOT NULL DEFAULT false,
  "group_id" TEXT,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE "repo_chats";
