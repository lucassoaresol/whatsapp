import WAWebJS from 'whatsapp-web.js';

import { IChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

class Vote {
  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
  ) {}

  public async save() {
    const database = await databasePromise;

    const dataVote = await database.insertIntoTable('votes', {
      selected_name: this.selectedName,
      chat_id: this.chatId,
      client_id: this.clientId,
    });
    console.log(`Vote with ID ${dataVote} has been added.`);
  }

  public async process() {
    const database = await databasePromise;

    const clientWPP = await this.getClientWPP();
    const chat = await database.searchUniqueByField<IChat>('chats', 'id', this.chatId);

    if (chat) {
      await this.save();
    } else if (clientWPP) {
      await this.getChatData(clientWPP);
      await this.save();
    }
  }

  public async getClientWPP() {
    const clientManager = await getClientManager();
    const client = clientManager.getClient(this.clientId);
    if (client) {
      const clientWPP = client.getWpp();
      if (clientWPP.info) return clientWPP;
    }
  }

  public async getChatData(clientWPP: WAWebJS.Client) {
    const database = await databasePromise;

    const chatData = await clientWPP.getChatById(this.chatId);
    let chatName = chatData.name || '';
    const chatIsGroup = chatData.isGroup;

    if (!chatIsGroup) {
      const contact = await clientWPP.getContactById(this.chatId);
      if (contact.pushname) chatName = contact.pushname;
    }

    await database.insertIntoTable('chats', {
      id: this.chatId,
      name: chatName,
      is_group: chatIsGroup,
    });
  }
}

export default Vote;
