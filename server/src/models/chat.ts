import databasePromise from '../libs/database';

class Chat {
  constructor(
    private id: string,
    private name: string,
    private isGroup: boolean,
  ) {}

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable('chats', {
      id: this.id,
      name: this.name,
      is_group: this.isGroup,
    });
  }

  public async setName(name: string) {
    this.name = name;

    const database = await databasePromise;

    await database.updateIntoTable('chats', { id: this.id, name: this.name });
  }
}

export default Chat;
