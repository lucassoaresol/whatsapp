-- up
CREATE TABLE "repo_chats" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "is_sync" BOOLEAN NOT NULL DEFAULT false,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL
);

-- down
DROP TABLE "repo_chats";
