-- up
CREATE TABLE "votes" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "selected_name" TEXT NOT NULL,
  "chat_id" INTEGER NOT NULL,
  "message_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "votes_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "clients_chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "votes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER notify_votes_new_record
AFTER INSERT ON "votes"
FOR EACH ROW
EXECUTE FUNCTION notify_new_record();

-- down
DROP TRIGGER IF EXISTS notify_votes_new_record ON "votes";

DROP TABLE "votes";
