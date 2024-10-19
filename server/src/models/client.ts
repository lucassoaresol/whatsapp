import QRCode from 'qrcode';
import Whatsapp from 'whatsapp-web.js';

import { IChatWithMessages } from '../interfaces/chat';
import databasePromise from '../libs/database';

import RepoChat from './repoChat';
import RepoMessage from './repoMessage';
import RepoVote from './repoVote';

const { Client: ClientWpp, LocalAuth } = Whatsapp;

class Client {
  private wpp;

  private id: string;

  private qrGeneratedAt: number | null = null;

  private qrInterval = 30000;

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

    this.wpp.on('qr', async (qr) => {
      this.qrGeneratedAt = Date.now();
      await QRCode.toFile(`public/qr/${this.id}_qr.png`, qr);
    });

    this.wpp.on('authenticated', () => console.log(`Client ${this.id} authenticated`));

    this.wpp.on('auth_failure', () => {});

    this.wpp.on('disconnected', (reason) =>
      console.log(`Client ${this.id} was logged out`, reason),
    );

    this.wpp.on('message', async (message) => await this.saveMessage(message));

    this.wpp.on('message_create', async (message) => await this.saveMessage(message));

    this.wpp.on('vote_update', async (vote) => await this.saveVote(vote));
  }

  private async loadChats() {
    const clientWpp = this.getWpp();
    const chats = await clientWpp.getChats();

    await Promise.all([
      chats.map(async (ch) => {
        const chat = new RepoChat(true, ch.id._serialized, this.id);
        return await chat.save();
      }),
    ]);
  }

  private async saveMessage(messageData: Whatsapp.Message) {
    const chatId = messageData.id.remote;
    const msgId = messageData.id._serialized;

    const chat = new RepoChat(false, chatId, this.id);
    const msg = new RepoMessage(true, msgId, chatId, this.id);

    await Promise.all([chat.save(), msg.save()]);
  }

  private async saveVote(voteData: Whatsapp.PollVote) {
    const selectedName = voteData.selectedOptions.at(0)?.name || '';
    const chatId = voteData.voter;

    const chat = new RepoChat(false, chatId, this.id);
    const vote = new RepoVote(selectedName, chatId, this.id);

    await Promise.all([chat.save(), vote.save()]);
  }

  public getRemainingTimeForNextQR(): number {
    if (this.qrGeneratedAt) {
      const elapsedTime = Date.now() - this.qrGeneratedAt;
      const remainingTime = this.qrInterval - elapsedTime;
      return remainingTime > 0 ? remainingTime : 0;
    }
    return 0;
  }

  public async save() {
    const database = await databasePromise;

    await database.insertIntoTable({ table: 'clients', dataDict: { id: this.id } });
  }

  public async start() {
    await this.wpp.initialize();
  }

  public getInfo() {
    if (this.wpp.info) return { id: this.id, ...this.wpp.info };

    return {
      id: this.id,
    };
  }

  public getWpp() {
    return this.wpp;
  }

  public getIsReady() {
    return this.isReady;
  }

  public getData() {
    return { ...this.getInfo(), isReady: this.isReady };
  }

  public async getChats() {
    const database = await databasePromise;

    const chats = await database.query<IChatWithMessages>(
      `SELECT c.id, c."name", c.is_group, c.profile_pic_url, cc.unread_count, cc."date",
cc.date_display, cc."hour", cc.messages FROM clients_chats cc
JOIN chats c ON cc.chat_id = c.id WHERE cc.client_id = $1 ORDER BY cc."date" DESC;`,
      [this.id],
    );

    return { ...this.getData(), chats: chats.filter((ch) => ch.name.length > 2) };
  }
}

export default Client;
