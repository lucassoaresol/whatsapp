import WAWebJS from 'whatsapp-web.js';

import { IChat } from '../interfaces/chat';
import { IMessage, IRepoMessage } from '../interfaces/message';
import databasePromise from '../libs/database';

import RepoMessage from './repoMessage';

class RepoMessageManager {
  private messages: Map<number, RepoMessage> = new Map();

  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const resultMessages = await database.searchAll<IRepoMessage>('repo_messages');

      for (const msg of resultMessages) {
        await this.addMessage(msg);
      }
    } catch (error) {
      console.error('Error loading clients from database:', error);
    }
  }

  public async addMessage(dataMessage: IRepoMessage) {
    if (this.messages.has(dataMessage.id)) {
      console.log(`Message with ID ${dataMessage.id} already exists.`);
      return;
    }

    const message = new RepoMessage(
      dataMessage.msg_id,
      dataMessage.data,
      dataMessage.from_me,
      dataMessage.chat_id,
      dataMessage.client_id,
      dataMessage.id,
    );
    this.messages.set(dataMessage.id, message);
    console.log(`Message with ID ${dataMessage.id} has been added.`);
  }

  public getMessage(id: number): RepoMessage | undefined {
    return this.messages.get(id);
  }

  public async removeMessage(id: number) {
    const message = this.messages.get(id);
    if (message) {
      await message.destroy();
      this.messages.delete(id);
      console.log(`Message with ID ${id} has been removed.`);
    } else {
      console.log(`Message with ID ${id} not found.`);
    }
  }

  public listMessage() {
    return Array.from(this.messages.values());
  }

  private async saveMessage(clientWPP: WAWebJS.Client, messageData: IRepoMessage) {
    const database = await databasePromise;

    const { chat_id } = messageData;
    const chatData = await clientWPP.getChatById(chat_id);
    let chatName = chatData.name || '';
    const chatIsGroup = chatData.isGroup;

    if (!chatIsGroup) {
      const contact = await clientWPP.getContactById(chat_id);
      if (contact.pushname) chatName = contact.pushname;
    }

    const chat = await database.searchUniqueByField<IChat>('chats', 'id', chat_id);

    if (chat) {
      if (!chatIsGroup && chat.name !== chatName) {
        await database.updateIntoTable('chats', { id: chat_id, name: chatName });
      }
    } else {
      await database.insertIntoTable('chats', {
        id: chat_id,
        name: chatName,
        is_group: chatIsGroup,
      });
    }

    const message = await database.searchUniqueByField<IMessage>(
      'messages',
      'id',
      messageData.msg_id,
    );

    if (!message) {
      await database.insertIntoTable('messages', {
        id: messageData.msg_id,
        data: messageData.data,
        from_me: messageData.from_me,
        chat_id,
        client_id: messageData.client_id,
      });
    }

    await this.removeMessage(messageData.id);
  }

  public async transferMessage() {
    const messages = this.listMessage();
    for (const msg of messages) {
      const clientWPP = await msg.getClientWPP();
      if (clientWPP) {
        await this.saveMessage(clientWPP, msg.getData());
      }
    }
  }
}

export default RepoMessageManager;