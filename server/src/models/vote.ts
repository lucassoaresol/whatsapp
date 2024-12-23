import { IClientChatWithChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import RepoVote from './repoVote';

class Vote {
  private isSaved = false;

  private selectedName!: string;
  private chatId!: number;

  constructor(private repoVote: RepoVote) {}

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable({
      table: 'votes',
      dataDict: {
        selected_name: this.selectedName,
        chat_id: this.chatId,
      },
    });

    this.isSaved = true;
  }

  public async process() {
    const database = await databasePromise;
    const dataRepo = this.repoVote.getData();
    this.selectedName = dataRepo.selectedName;

    const chatData = await database.findFirst<IClientChatWithChat>({
      table: 'clients_chats',
      where: { client_id: dataRepo.clientId, chat_id: dataRepo.chatId },
      joins: [
        {
          table: 'chats',
          alias: 'c',
          on: { chat_id: 'id' },
        },
      ],
      select: { key: true, 'c.is_group': true },
    });

    if (chatData) {
      this.chatId = chatData.key;
      await this.save();
    }

    return this.isSaved;
  }
}

export default Vote;
