-- up
ALTER TABLE "clients_chats"
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TRIGGER update_clients_chats_updated_at
BEFORE UPDATE ON "clients_chats"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_clients_chats_updated_at ON "clients_chats";

ALTER TABLE "clients_chats"
DROP COLUMN IF EXISTS "updated_at";
