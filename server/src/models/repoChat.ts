import { IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

class RepoChat {
  private isSaved = false;

  constructor(
    private chatId: string,
    private clientId: string,
    private group_id?: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;
    const repoChatDTO = await database.insertIntoTable({
      table: 'repo_chats',
      dataDict: {
        group_id: this.group_id,
        chat_id: this.chatId,
        client_id: this.clientId,
      },
      select: { id: true },
    });
    const repoChatData = repoChatDTO as { id: number };
    this.id = repoChatData.id;
  }

  public async destroy() {
    const database = await databasePromise;

    await database.deleteFromTable({ table: 'repo_chats', where: { id: this.id! } });
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
        await database.updateIntoTable<IClientChat>({
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
          select: { key: true },
        });
      }

      this.isSaved = true;
    }

    return this.isSaved;
  }

  public getData() {
    return {
      groupId: this.group_id,
      chatId: this.chatId,
      clientId: this.clientId,
    };
  }
}

export default RepoChat;
