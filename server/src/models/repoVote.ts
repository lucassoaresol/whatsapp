import Vote from './vote';

class RepoVote {
  private isSaved = false;

  constructor(
    private selectedName: string,
    private chatId: string,
    private clientId: string,
  ) {}

  public async save() {
    const vote = new Vote(this);

    this.isSaved = await vote.process();

    return this.isSaved;
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
