import { IChat, IClientChat } from '../interfaces/chat';
import databasePromise from '../libs/database';
import { formatTimestamp } from '../utils/formatTimestamp';

import Client from './client';
import { getClientManager } from './clientManager';

class ChatManager {
  public async loadDataFromDatabase() {
    try {
      const clientManager = await getClientManager();
      const clients = clientManager.getClients();
      for (const client of clients) {
        await this.getChatsWpp(client);
      }
    } catch (error) {
      console.error('Error loading chats from database:', error);
    }
  }

  private async getChatsWpp(client: Client) {
    const clientWpp = client.getWpp();
    const chats = await clientWpp.getChats();

    await Promise.all(
      chats.map(async (ch) => {
        return await this.retrieveChatWpp(client, ch.id._serialized);
      }),
    );
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

export const getChatManager = async (): Promise<ChatManager> => {
  if (!instance) {
    instance = new ChatManager();
    await instance.loadDataFromDatabase();
  }
  return instance;
};

export default ChatManager;
