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
      }>('SELECT DISTINCT ON (chat_id) * FROM repo_chats LIMIT 10;');

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

  public async saveChat(chat_id: string, client_id: string) {
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

  private async getChatData(client: Client, id: string) {
    const clientWpp = client.getWpp();
    const chat = await clientWpp.getChatById(id);
    const isGroup = chat.isGroup;
    let name = chat.name;
    let profilePicUrl = null;

    if (id.length > 7) {
      const contact = await clientWpp.getContactById(id);
      profilePicUrl = (await contact.getProfilePicUrl()) || null;
      if (!isGroup) {
        name = contact.pushname;
      }

      if (!name) {
        name = contact.name || contact.number;
      }
    }

    if (!name) {
      name = '';
    }

    return {
      chat,
      data: {
        id,
        name,
        is_group: isGroup,
        profile_pic_url: profilePicUrl,
      },
    };
  }

  public async retrieveChatWpp(client: Client, id: string) {
    const database = await databasePromise;
    const { chat, data } = await this.getChatData(client, id);
    const { name, is_group, profile_pic_url } = data;

    const messages = await Promise.all(
      (await chat.fetchMessages({ limit: 5 })).reverse().map(async (msg) => {
        let from = null;
        if (is_group && !msg.fromMe && msg.id.participant) {
          const { data: fromData } = await this.getChatData(
            client,
            msg.id.participant._serialized,
          );
          from = fromData;
        }
        return {
          id: msg.id._serialized,
          body: msg.body,
          fromMe: msg.fromMe,
          ...formatTimestamp(msg.timestamp),
          from,
        };
      }),
    );

    const chatData = await database.findFirst<IChat>({ table: 'chats', where: { id } });

    if (chatData) {
      if (!is_group) {
        if (chatData.name !== name) {
          await database.updateIntoTable<IChat>({
            table: 'chats',
            dataDict: { name },
            where: { id },
          });
        }
        if (chatData.profile_pic_url !== profile_pic_url) {
          await database.updateIntoTable<IChat>({
            table: 'chats',
            dataDict: { profile_pic_url },
            where: { id },
          });
        }
      }
    } else {
      await database.insertIntoTable<IChat>({
        table: 'chats',
        dataDict: data,
      });
    }

    if (messages.length > 0) {
      const client_id = client.getInfo().id;

      const clientChat = await database.findFirst<IClientChat>({
        table: 'clients_chats',
        where: { client_id, chat_id: id },
        select: { key: true },
      });

      let dataDict = {
        unread_count: chat.unreadCount,
        ...formatTimestamp(chat.timestamp),
        messages: JSON.stringify(messages),
      };

      if (dataDict.date === 'Invalid Date') {
        dataDict = {
          ...dataDict,
          date: messages[0].date,
          date_display: messages[0].date_display,
          hour: messages[0].hour,
        };
      }

      if (clientChat) {
        const key = clientChat.key;

        await database.updateIntoTable<IClientChat>({
          table: 'clients_chats',
          dataDict,
          where: { key },
        });
      } else {
        await database.insertIntoTable({
          table: 'clients_chats',
          dataDict: {
            client_id,
            chat_id: id,
            ...dataDict,
          },
        });
      }
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
