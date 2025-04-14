import Vote from './vote';

class RepoVote {
  private isSaved = false;

  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
  ) { }

  public async save() {
    const vote = new Vote(this);

    await vote.process();
  }

  public getData() {
    return {
      selectedName: this.selectedName,
      chatId: this.chatId,
      clientId: this.clientId,
    };
  }
}

export default RepoVote;
