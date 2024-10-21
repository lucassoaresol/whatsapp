-- up
CREATE TABLE "status_types" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

-- down
DROP TABLE "status_types";
