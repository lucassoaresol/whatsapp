import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

class RepoMessage {
  constructor(
    private statusId: number,
    private msgId: string,
    private chatId: string,
    private clientId: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;
    const repoMessageDTO = await database.insertIntoTable({
      table: 'repo_messages',
      dataDict: {
        status_id: this.statusId,
        msg_id: this.msgId,
        chat_id: this.chatId,
        client_id: this.clientId,
      },
      select: { id: true },
    });
    const repoMessageData = repoMessageDTO as { id: number };
    this.id = repoMessageData.id;
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

  public getData() {
    return {
      statusId: this.statusId,
      msgId: this.msgId,
      chatId: this.chatId,
      clientId: this.clientId,
    };
  }
}

export default RepoMessage;
