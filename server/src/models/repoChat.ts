import { IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import Chat from './chat';
import { getClientManager } from './clientManager';

class RepoChat {
  private isSaved = false;

  constructor(
    private chatId: string,
    private clientId: string,
    private groupId?: string,
  ) {}

  public async save() {
    const chat = new Chat(this);

    this.isSaved = await chat.save();

    if (this.isSaved && !this.groupId) {
      await this.saveClientChat();
    }

    return this.isSaved;
  }

  public async getClientWPP() {
    const clientManager = await getClientManager();
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
        select: { key: true },
      });

      if (clientChat) {
        await database.updateIntoTable({
          table: 'clients_chats',
          dataDict: { unread_count: chat.unreadCount },
          where: { key: clientChat.key },
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

      this.isSaved = true;
    }
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
