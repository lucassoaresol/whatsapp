import { IRepoChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import Chat from './chat';
import RepoChat from './repoChat';

class RepoChatManager {
  private chats: Map<string, Chat> = new Map();

  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const chats = await database.query<IRepoChat>(
        'SELECT * FROM repo_chats LIMIT 10;',
      );

      await Promise.all(chats.map(async (ch) => await this.addChat(ch)));
    } catch (error) {
      console.error('Error loading chats from database:', error);
    }
  }

  private async addChat({ chat_id, client_id, id, is_sync }: IRepoChat) {
    if (this.chats.has(chat_id)) {
      console.log(`Chat with ID ${id} already exists.`);
      return;
    }

    const repoChat = new RepoChat(is_sync, chat_id, client_id, id);

    const chat = new Chat(repoChat);

    await chat.save();

    if (is_sync) {
      await repoChat.syncClient();
    }

    await Promise.all([repoChat.saveClientChat(), repoChat.destroy()]);

    this.chats.set(chat_id, chat);
    console.log(`Chat with ID ${id} has been added.`);
  }
}

export default RepoChatManager;
