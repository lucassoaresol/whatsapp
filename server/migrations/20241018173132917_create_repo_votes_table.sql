-- up
CREATE TABLE "repo_votes" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "selected_name" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER notify_repo_votes_new_record
AFTER INSERT ON "repo_votes"
FOR EACH ROW
EXECUTE FUNCTION notify_new_record();

-- down
DROP TRIGGER IF EXISTS notify_repo_votes_new_record ON "repo_votes";

DROP TABLE "repo_votes";
