import WAWebJS from 'whatsapp-web.js';

import { IChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

interface IVote {
  id: number;
}

class Vote {
  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
  ) {}

  public async save() {
    const database = await databasePromise;

    const dataVote = (await database.insertIntoTable<IVote>({
      table: 'votes',
      dataDict: {
        selected_name: this.selectedName,
        chat_id: this.chatId,
        client_id: this.clientId,
      },
      select: { id: true },
    })) as IVote;

    console.log(`Vote with ID ${dataVote.id} has been added.`);
  }

  public async process() {
    const database = await databasePromise;

    const clientWPP = await this.getClientWPP();
    const chat = await database.findFirst<IChat>({
      table: 'chats',
      where: { id: this.chatId },
    });

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
    let chatName = chatData.name;
    let profilePicUrl = null;
    const chatIsGroup = chatData.isGroup;

    if (this.chatId.length > 7) {
      const contact = await clientWPP.getContactById(this.chatId);
      profilePicUrl = (await contact.getProfilePicUrl()) || null;
      if (!chatIsGroup) {
        chatName = contact.pushname;
      }
    }

    if (!chatName) {
      chatName = '';
    }

    await database.insertIntoTable({
      table: 'chats',
      dataDict: {
        id: this.chatId,
        name: chatName,
        is_group: chatIsGroup,
        profile_pic_url: profilePicUrl,
      },
    });
  }
}

export default Vote;
