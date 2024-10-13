import databasePromise from '../libs/database';

class Chat {
  constructor(
    private id: string,
    private name: string,
    private isGroup: boolean,
  ) {}

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable({
      table: 'chats',
      dataDict: {
        id: this.id,
        name: this.name,
        is_group: this.isGroup,
      },
    });
  }

  public async setName(name: string) {
    this.name = name;

    const database = await databasePromise;

    await database.updateIntoTable({
      table: 'chats',
      dataDict: { name: this.name },
      where: { id: this.id },
    });
  }
}

export default Chat;
