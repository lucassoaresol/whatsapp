-- up
CREATE TABLE "chats" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "is_group" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- down
DROP TABLE "chats";
