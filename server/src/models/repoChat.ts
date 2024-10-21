import { IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';
import RepoMessage from './repoMessage';

class RepoChat {
  constructor(
    private isSync: boolean,
    private chatId: string,
    private clientId: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;
    const repoChatDTO = await database.insertIntoTable({
      table: 'repo_chats',
      dataDict: {
        is_sync: this.isSync,
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

  private async processSync(msgId: string) {
    const database = await databasePromise;

    const msgData = await database.findFirst({
      table: 'messages',
      where: { id: msgId },
      select: { id: true },
    });

    if (!msgData) {
      const repo = new RepoMessage(6, msgId, this.chatId, this.clientId);
      await repo.save();
    }
  }

  public async syncClient() {
    const clientWpp = await this.getClientWPP();
    if (clientWpp) {
      const chat = await clientWpp.getChatById(this.chatId);
      const messages = await chat.fetchMessages({ limit: 50 });

      await Promise.all(
        messages.map(async (msg) => await this.processSync(msg.id._serialized)),
      );
    }
  }

  public async saveClientChat() {
    let key = 0;
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
        key = clientChat.key;

        await database.updateIntoTable<IClientChat>({
          table: 'clients_chats',
          dataDict: { unread_count: chat.unreadCount },
          where: { key },
        });
      } else {
        const clientChatDTO = await database.insertIntoTable({
          table: 'clients_chats',
          dataDict: {
            client_id: this.clientId,
            chat_id: this.chatId,
            unread_count: chat.unreadCount,
          },
          select: { key: true },
        });
        const clientChatData = clientChatDTO as { key: number };
        key = clientChatData.key;
      }
    }
    return key;
  }

  public getData() {
    return {
      chatId: this.chatId,
      clientId: this.clientId,
    };
  }
}

export default RepoChat;
