-- up
CREATE TABLE "repo_votes" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "selected_name" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- down
DROP TABLE "repo_votes";
