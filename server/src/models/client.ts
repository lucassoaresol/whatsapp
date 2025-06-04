import QRCode from 'qrcode';
import Whatsapp, { MessageId } from 'whatsapp-web.js';

import databasePromise from '../libs/database';
import { listChatByClientId } from '../utils/listChatByClientId';
import { chatQueue } from '../worker/services/chat';
import { messageQueue } from '../worker/services/message';
import { voteQueue } from '../worker/services/vote';

const { Client: ClientWpp, LocalAuth } = Whatsapp;

class Client {
  private wpp;

  private id: string;

  private isReady = false;

  constructor(id: string) {
    this.id = id;
    this.wpp = new ClientWpp({
      authStrategy: new LocalAuth({ clientId: this.id }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    });

    this.listenEvents();
  }

  private listenEvents() {
    this.wpp.on('ready', async () => {
      this.isReady = true;
      console.log(`Client ${this.id} ready!`);
      await this.loadChats();
      console.log('Chats loaded from database.');
    });

    this.wpp.on(
      'qr',
      async (qr) => await QRCode.toFile(`public/qr/${this.id}_qr.png`, qr),
    );

    this.wpp.on('authenticated', () => console.log(`Client ${this.id} authenticated`));

    this.wpp.on('disconnected', (reason) =>
      console.log(`Client ${this.id} was logged out`, reason),
    );

    this.wpp.on('message', async (message) => await this.saveMessage(message, 2));

    this.wpp.on('message_create', async (message) => {
      if (message.fromMe) {
        await this.saveMessage(message, 1);
      }
    });

    this.wpp.on('message_edit', async (message) => await this.saveMessage(message, 4));

    this.wpp.on('message_revoke_everyone', async (message) => {
      await this.saveMessage(message, 5);
      const revoked_msg = message as unknown as {
        _data: { protocolMessageKey: MessageId };
      };
      await this.saveMessage(
        { ...message, id: revoked_msg._data.protocolMessageKey },
        6,
      );
    });

    this.wpp.on('vote_update', async (vote) => await this.saveVote(vote));
  }

  public async loadChats() {
    const clientWpp = this.getWpp();
    let chats = await clientWpp.getChats();

    chats = chats.filter((ch) => ch.id._serialized.length > 7);

    await Promise.all([
      chats.map(async (ch) => {
        return await chatQueue.add(
          'save-chat',
          {
            chat_id: ch.id._serialized,
            client_id: this.id,
          },
          { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
        );
      }),
    ]);
  }

  private async saveMessage(messageData: Whatsapp.Message, statusId: number) {
    const chatId = messageData.id.remote;
    if (chatId.length > 7) {
      const msgId = messageData.id._serialized;
      await Promise.all([
        chatQueue.add(
          'save-chat',
          {
            chat_id: chatId,
            client_id: this.id,
          },
          { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
        ),
        messageQueue.add(
          'save-message',
          {
            status_id: statusId,
            msg_id: msgId,
            chat_id: chatId,
            client_id: this.id,
          },
          { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
        ),
      ]);
    }
  }

  private async saveVote(voteData: Whatsapp.PollVote) {
    const selectedName = voteData.selectedOptions.at(0)?.name || '';
    const chatId = voteData.voter;

    if (chatId.length > 7) {
      await Promise.all([
        chatQueue.add(
          'save-chat',
          {
            chat_id: chatId,
            client_id: this.id,
          },
          { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
        ),
        voteQueue.add(
          'save-vote',
          {
            chat_id: chatId,
            client_id: this.id,
            selected_name: selectedName,
          },
          { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
        ),
      ]);
    }
  }

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable({ table: 'clients', dataDict: { id: this.id } });
  }

  public async start() {
    await this.wpp.initialize();
  }

  public getInfo() {
    const result = {
      id: this.id,
      isReady: this.isReady,
    };

    if (this.wpp.info) { return { ...result, ...this.wpp.info }; }

    return result;
  }

  public getWpp() {
    return this.wpp;
  }

  public getIsReady() {
    return this.isReady;
  }

  public async getChats() {
    const data = this.getInfo();

    const chats = await listChatByClientId(this.id);

    return { ...data, chats: chats.filter((ch) => ch.name.length > 2) };
  }
}

export default Client;
