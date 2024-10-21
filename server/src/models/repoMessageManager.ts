import { IRepoMessage } from '../interfaces/message';
import databasePromise from '../libs/database';

import Message from './message';
import RepoMessage from './repoMessage';

class RepoMessageManager {
  private messages: Map<string, Message> = new Map();

  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const messages = await database.query<IRepoMessage>(
        'SELECT DISTINCT ON (msg_id) * FROM repo_messages ORDER BY msg_id, created_at DESC LIMIT 10;',
      );

      await Promise.all(messages.map(async (msg) => await this.addMessage(msg)));
    } catch (error) {
      console.error('Error loading messages from database:', error);
    }
  }

  public async addMessage({ chat_id, client_id, id, msg_id, status_id }: IRepoMessage) {
    if (this.messages.has(msg_id)) {
      console.log(`Message with ID ${msg_id} already exists.`);
      return;
    }

    const repoMessage = new RepoMessage(status_id, msg_id, chat_id, client_id, id);

    const message = new Message(repoMessage);

    const isSaved = await message.save();

    if (isSaved) {
      await repoMessage.destroy();
    }

    this.messages.set(msg_id, message);
    console.log(`Message with ID ${msg_id} has been added.`);
  }
}

export default RepoMessageManager;
