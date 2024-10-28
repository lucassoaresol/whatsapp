import { IRepoChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import Chat from './chat';
import RepoChat from './repoChat';

class RepoChatManager {
  private currentOffset = 0;
  private limitPerPage = 10;

  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const chats = await database.query<IRepoChat>(
        'SELECT DISTINCT ON (chat_id) * FROM repo_chats OFFSET $1 LIMIT $2;',
        [this.currentOffset, this.limitPerPage],
      );

      if (chats.length === 0) {
        this.resetOffset();
        return;
      }

      await Promise.all(chats.map(async (ch) => this.saveChat(ch)));

      this.currentOffset += this.limitPerPage;
    } catch (error) {
      console.error('Error loading chats from database:', error);
    }
  }

  private async saveChat({ chat_id, client_id, id, group_id }: IRepoChat) {
    let isSaved = false;
    const repoChat = new RepoChat(chat_id, client_id, group_id, id);

    const chat = new Chat(repoChat);

    isSaved = await chat.save();

    if (isSaved && !group_id) {
      isSaved = await repoChat.saveClientChat();
    }

    if (isSaved) {
      await repoChat.destroy();
      console.log(`Chat with ID ${chat_id} has been added.`);
    }
  }

  private resetOffset() {
    this.currentOffset = 0;
  }
}

export default RepoChatManager;
