-- up
CREATE TABLE "repo_messages" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "is_new" BOOLEAN NOT NULL DEFAULT false,
  "msg_id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE "repo_messages";
