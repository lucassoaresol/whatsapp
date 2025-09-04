import { Database } from "pg-utils";

import databaseWhatsappPromise from "../db/whatsapp";
import { IClientChatWithChat } from "../interfaces/chat";
import { IMessage } from "../interfaces/message";
import { retriveMessageWpp } from "../libs/axios";
import { messageQueue } from "../worker/services/message";

class Vote {
  private database!: Database;

  constructor(
    private selectedName: string,
    private chatId: string,
    private messageId: string,
    private clientId: string,
  ) {}

  public async save() {
    this.database = await databaseWhatsappPromise;

    const chatData = await this.database.findFirst<IClientChatWithChat>({
      table: "clients_chats",
      where: { client_id: this.clientId, chat_id: this.chatId },
      joins: [
        {
          table: "chats",
          alias: "c",
          on: { chat_id: "id" },
        },
      ],
      select: { id: true },
    });

    if (chatData) {
      const messageData = await this.database.findFirst<IMessage>({
        table: "messages",
        where: { id: this.messageId },
        select: { id: true },
      });

      if (messageData) {
        await this.database.insertIntoTable({
          table: "votes",
          dataDict: {
            selected_name: this.selectedName,
            chat_id: chatData.id,
            message_id: this.messageId,
          },
        });
      } else {
        const message = await retriveMessageWpp(this.clientId, this.messageId);

        messageQueue.add(
          "save-message",
          {
            status_id: 1,
            msg_id: this.messageId,
            chat_id: message.chatId,
            client_id: this.clientId,
          },
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );

        throw new Error("message not found");
      }
    } else {
      throw new Error("chat not found");
    }
  }
}

export default Vote;
