import { IRepoMessage } from '../interfaces/message';
import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

class RepoMessage {
  constructor(
    private msgId: string,
    private data: any,
    private fromMe: boolean,
    private chatId: string,
    private clientId: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;

    const repoMessageData = await database.insertIntoTable({
      table: 'repo_messages',
      dataDict: {
        msg_id: this.msgId,
        data: this.data,
        from_me: this.fromMe,
        chat_id: this.chatId,
        client_id: this.clientId,
      },
    });
    this.id = Number(repoMessageData);
  }

  public async destroy() {
    const database = await databasePromise;

    await database.deleteFromTable({ table: 'repo_messages', where: { id: this.id! } });
  }

  public async getClientWPP() {
    const clientManager = await getClientManager();
    const client = clientManager.getClient(this.clientId);
    if (client) {
      const clientWPP = client.getWpp();
      if (clientWPP.info) return clientWPP;
    }
  }

  public getData(): IRepoMessage {
    return {
      id: this.id!,
      msg_id: this.msgId,
      data: this.data,
      from_me: this.fromMe,
      chat_id: this.chatId,
      client_id: this.clientId,
    };
  }
}

export default RepoMessage;
