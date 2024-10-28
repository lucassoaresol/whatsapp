-- up
CREATE TABLE "repo_chats" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "group_id" TEXT,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE "repo_chats";
