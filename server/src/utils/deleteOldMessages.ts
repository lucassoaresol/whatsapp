import databaseWhatsappPromise from "../db/whatsapp";
import { IRepoMessage } from "../interfaces/message";
import dayLib from "../libs/dayjs";
import Message from "../models/message";

export async function deleteOldMessages(daysBack = 5) {
  const database = await databaseWhatsappPromise;
  const dateRef = dayLib()
    .subtract(daysBack, "day")
    .format("YYYY-MM-DD HH:mm:ss.SSS");

  const messages = await database.findMany<IRepoMessage>({
    table: "messages",
    joins: [{ table: "clients_chats", on: { chat_id: "id" } }],
    where: { created_at: { lte: dateRef } },
    select: {
      "m.id AS msg_id": true,
      "cc.chat_id AS chat_id": true,
      "cc.client_id AS client_id": true,
    },
  });

  await Promise.all(
    messages.map(async (msg) => {
      const repoMsg = new Message(7, msg.msg_id, msg.chat_id, msg.client_id);
      return await repoMsg.save();
    }),
  );
}
