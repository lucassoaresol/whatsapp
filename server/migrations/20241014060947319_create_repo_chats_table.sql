-- up
CREATE TABLE "repo_chats" (
  "id" SERIAL NOT NULL,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  CONSTRAINT "repo_chats_pkey" PRIMARY KEY ("id")
);

-- down
DROP TABLE "repo_chats";
