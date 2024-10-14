import { IChat, IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';
import { formatTimestamp } from '../utils/formatTimestamp';

import Client from './client';
import { getClientManager } from './clientManager';

class ChatManager {
  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const chats = await database.query<{
        chat_id: string;
        client_id: string;
      }>('SELECT * FROM repo_chats LIMIT 10;');

      await Promise.all(
        chats.map(async (dt) => {
          return await this.processChat(dt.chat_id, dt.client_id);
        }),
      );
    } catch (error) {
      console.error('Error loading chats from database:', error);
    }
  }

  public async getChatsWpp(client: Client) {
    const clientWpp = client.getWpp();
    const chats = await clientWpp.getChats();

    await Promise.all(
      chats.map(async (ch) => {
        return await this.saveChat(ch.id._serialized, client.getInfo().id);
      }),
    );
  }

  private async saveChat(chat_id: string, client_id: string) {
    const database = await databasePromise;

    await database.insertIntoTable({
      table: 'repo_chats',
      dataDict: { chat_id, client_id },
    });
  }

  private async processChat(chat_id: string, client_id: string) {
    const [database, clientManager] = await Promise.all([
      databasePromise,
      getClientManager(),
    ]);

    const client = clientManager.getClient(client_id);

    if (client && client.getIsReady()) {
      await Promise.all([
        this.retrieveChatWpp(client, chat_id),
        database.deleteFromTable({
          table: 'repo_chats',
          where: { chat_id, client_id },
        }),
      ]);
    }
  }

  public async retrieveChatWpp(client: Client, id: string) {
    const database = await databasePromise;
    const clientWpp = client.getWpp();
    const chat = await clientWpp.getChatById(id);
    const contact = await clientWpp.getContactById(id);
    const isGroup = chat.isGroup;
    let name = chat.name;
    const profilePicUrl = (await contact.getProfilePicUrl()) || null;

    if (!isGroup) {
      name = contact.pushname;
    }

    if (!name) {
      name = '';
    }

    const messages = await Promise.all(
      (await chat.fetchMessages({ limit: 5 })).reverse().map((msg) => {
        return {
          id: msg.id._serialized,
          body: msg.body,
          fromMe: msg.fromMe,
          ...formatTimestamp(msg.timestamp),
          from: msg.author || null,
        };
      }),
    );

    const chatData = await database.findFirst<IChat>({ table: 'chats', where: { id } });

    if (chatData) {
      if (!isGroup) {
        if (chatData.name !== name) {
          await database.updateIntoTable<IChat>({
            table: 'chats',
            dataDict: { name },
            where: { id },
          });
        }
        if (chatData.profile_pic_url !== profilePicUrl) {
          await database.updateIntoTable<IChat>({
            table: 'chats',
            dataDict: { profile_pic_url: profilePicUrl },
            where: { id },
          });
        }
      }
    } else {
      await database.insertIntoTable<IChat>({
        table: 'chats',
        dataDict: { id, name, is_group: isGroup, profile_pic_url: profilePicUrl },
      });
    }

    const client_id = client.getInfo().id;

    const clientChat = await database.findFirst<IClientChat>({
      table: 'clients_chats',
      where: { client_id, chat_id: id },
      select: { key: true },
    });

    if (clientChat) {
      const key = clientChat.key;

      await database.updateIntoTable<IClientChat>({
        table: 'clients_chats',
        dataDict: {
          unread_count: chat.unreadCount,
          ...formatTimestamp(chat.timestamp),
          messages: JSON.stringify(messages),
        },
        where: { key },
      });
    } else {
      await database.insertIntoTable({
        table: 'clients_chats',
        dataDict: {
          client_id,
          chat_id: id,
          unread_count: chat.unreadCount,
          ...formatTimestamp(chat.timestamp),
          messages: JSON.stringify(messages),
        },
      });
    }
  }
}

let instance: ChatManager | null = null;

export const getChatManager = (): ChatManager => {
  if (!instance) {
    instance = new ChatManager();
  }
  return instance;
};

export default ChatManager;
