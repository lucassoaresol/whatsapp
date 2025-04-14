import { IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import Chat from './chat';
import { ClientManagerPromise } from './clientManager';

class RepoChat {
  constructor(
    private chatId: string,
    private clientId: string,
    private groupId?: string,
  ) {}

  public async save() {
    const chat = new Chat(this);

    await chat.save();

    if (!this.groupId) {
      await this.saveClientChat();
    }
  }

  public async getClientWPP() {
    const clientManager = await ClientManagerPromise;
    const client = clientManager.getClient(this.clientId);
    if (client) {
      const clientWPP = client.getWpp();
      if (clientWPP.info) return clientWPP;
    }
  }

  public async saveClientChat() {
    const [clientWpp, database] = await Promise.all([
      this.getClientWPP(),
      databasePromise,
    ]);
    if (clientWpp) {
      const chat = await clientWpp.getChatById(this.chatId);

      const clientChat = await database.findFirst<IClientChat>({
        table: 'clients_chats',
        where: { client_id: this.clientId, chat_id: this.chatId },
        select: { id: true },
      });

      if (clientChat) {
        await database.updateIntoTable({
          table: 'clients_chats',
          dataDict: { unread_count: chat.unreadCount },
          where: { id: clientChat.id },
        });
      } else {
        await database.insertIntoTable({
          table: 'clients_chats',
          dataDict: {
            client_id: this.clientId,
            chat_id: this.chatId,
            unread_count: chat.unreadCount,
          },
        });
      }
    }
    throw new Error('client wpp not found');
  }

  public getData() {
    return {
      groupId: this.groupId,
      chatId: this.chatId,
      clientId: this.clientId,
    };
  }
}

export default RepoChat;
