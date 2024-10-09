import databasePromise from '../libs/database';

class Message {
  constructor(
    private id: string,
    private data: any,
    private fromMe: boolean,
    private isNew: boolean,
    private createdAt: Date,
    private chatId: string,
    private clientId: string,
  ) {}

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable('messages', {
      id: this.id,
      data: this.data,
      from_me: this.fromMe,
      is_new: this.isNew,
      created_at: this.createdAt,
      chat_id: this.chatId,
      client_id: this.clientId,
    });
  }
}

export default Message;
