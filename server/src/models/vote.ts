import { Database } from 'pg-utils';

import { IClientChatWithChat } from '../interfaces/chat';
import databaseWhatsappPromise from '../db/whatsapp';

class Vote {
  private database!: Database;

  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
  ) { }

  public async save() {
    this.database = await databaseWhatsappPromise;

    const chatData = await this.database.findFirst<IClientChatWithChat>({
      table: 'clients_chats',
      where: { client_id: this.clientId, chat_id: this.chatId },
      joins: [
        {
          table: 'chats',
          alias: 'c',
          on: { chat_id: 'id' },
        },
      ],
      select: { id: true },
    });

    if (chatData) {
      await this.database.insertIntoTable({
        table: 'votes',
        dataDict: {
          selected_name: this.selectedName,
          chat_id: chatData.id,
        },
      });
    } else {
      throw new Error('chat not found');
    }
  }
}

export default Vote;
