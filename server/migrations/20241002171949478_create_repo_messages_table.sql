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

CREATE TRIGGER notify_repo_messages_new_record
AFTER INSERT ON "repo_messages"
FOR EACH ROW
EXECUTE FUNCTION notify_new_record();

-- down
DROP TRIGGER IF EXISTS notify_repo_messages_new_record ON "repo_messages";

DROP TABLE "repo_messages";
