import { IRepoMessage } from '../interfaces/message';
import databasePromise from '../libs/database';

import Message from './message';
import RepoMessage from './repoMessage';

class RepoMessageManager {
  private currentOffset: number = 0;
  private limitPerPage: number = 10;

  public async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const messages = await database.query<IRepoMessage>(
        'SELECT DISTINCT ON (msg_id) * FROM repo_messages ORDER BY msg_id, created_at DESC OFFSET $1 LIMIT $2;',
        [this.currentOffset, this.limitPerPage],
      );

      if (messages.length === 0) {
        this.resetOffset();
        return;
      }

      await Promise.all(messages.map(async (msg) => await this.saveMessage(msg)));

      this.currentOffset += this.limitPerPage;
    } catch (error) {
      console.error('Error loading messages from database:', error);
    }
  }

  private async saveMessage({
    chat_id,
    client_id,
    id,
    msg_id,
    status_id,
  }: IRepoMessage) {
    const repoMessage = new RepoMessage(status_id, msg_id, chat_id, client_id, id);

    const message = new Message(repoMessage);

    const isSaved = await message.save();

    if (isSaved) {
      await repoMessage.destroy();
      console.log(`Message with ID ${msg_id} has been added.`);
    }
  }

  private resetOffset() {
    this.currentOffset = 0;
  }
}

export default RepoMessageManager;
