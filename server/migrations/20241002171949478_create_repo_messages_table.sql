-- up
CREATE TABLE "repo_messages" (
  "id" SERIAL NOT NULL,
  "msg_id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "from_me" BOOLEAN NOT NULL DEFAULT false,
  "chat_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "client_id" TEXT NOT NULL,
  CONSTRAINT "repo_messages_pkey" PRIMARY KEY ("id")
);

-- down
DROP TABLE "repo_messages";
