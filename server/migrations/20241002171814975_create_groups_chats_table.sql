-- up
CREATE TABLE "groups_chats" (
  "key" SERIAL NOT NULL UNIQUE,
  "group_id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "groups_chats_pkey" PRIMARY KEY ("group_id","chat_id"),
  CONSTRAINT "groups_chats_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "groups_chats_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE "groups_chats";
