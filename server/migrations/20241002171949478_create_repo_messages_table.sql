-- up
CREATE TABLE "repo_messages" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "status_id" INT NOT NULL,
  "msg_id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "repo_messages_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "repo_messages";
