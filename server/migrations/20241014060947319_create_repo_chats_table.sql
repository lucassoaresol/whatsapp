-- up
CREATE TABLE "repo_chats" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "group_id" TEXT,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER notify_repo_chats_new_record
AFTER INSERT ON "repo_chats"
FOR EACH ROW
EXECUTE FUNCTION notify_new_record();

-- down
DROP TRIGGER IF EXISTS notify_repo_chats_new_record ON "repo_chats";

DROP TABLE "repo_chats";
