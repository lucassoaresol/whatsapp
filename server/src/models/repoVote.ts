import databasePromise from '../libs/database';

import { getClientManager } from './clientManager';

class RepoVote {
  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;
    const repoVoteDTO = await database.insertIntoTable({
      table: 'repo_votes',
      dataDict: {
        selected_name: this.selectedName,
        chat_id: this.chatId,
        client_id: this.clientId,
      },
      select: { id: true },
    });
    const repoVote = repoVoteDTO as { id: number };
    this.id = repoVote.id;
  }

  public async destroy() {
    const database = await databasePromise;

    await database.deleteFromTable({ table: 'repo_votes', where: { id: this.id! } });
  }

  public async getClientWPP() {
    const clientManager = await getClientManager();
    const client = clientManager.getClient(this.clientId);
    if (client) {
      const clientWPP = client.getWpp();
      if (clientWPP.info) return clientWPP;
    }
  }
}

export default RepoVote;
