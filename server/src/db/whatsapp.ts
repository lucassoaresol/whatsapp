import { Database } from "pg-utils";

import getDatabase from "./database";

const databaseWhatsappPromise: Promise<Database> = (async () => {
  return await getDatabase("whatsapp");
})();

export default databaseWhatsappPromise;
