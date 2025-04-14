import { chatQueue } from '../worker/services/chat';

import { ClientManagerPromise } from './clientManager';
import Message from './message';

class RepoMessage {
  private isSaved = false;

  constructor(
    private statusId: number,
    private msgId: string,
    private chatId: string,
    private clientId: string,
  ) {}

  public async save() {
    const message = new Message(this);

    this.isSaved = await message.save();

    await chatQueue.add(
      'save-chat',
      {
        chat_id: this.chatId,
        client_id: this.clientId,
      },
      { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
    );

    return this.isSaved;
  }

  public async getClientWPP() {
    const clientManager = await ClientManagerPromise;
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
