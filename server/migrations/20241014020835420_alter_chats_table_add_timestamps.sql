-- up
ALTER TABLE "chats"
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON "chats"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_chats_updated_at ON "chats";

ALTER TABLE "chats"
DROP COLUMN IF EXISTS "created_at",
DROP COLUMN IF EXISTS "updated_at";
