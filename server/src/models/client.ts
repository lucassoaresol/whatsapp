import QRCode from 'qrcode';
import Whatsapp, { MessageId } from 'whatsapp-web.js';

import { IClient } from '../interfaces/client';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import { listChatByClientId } from '../utils/listChatByClientId';

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

  private syncStatus: 'idle' | 'syncing' | 'synced' = 'idle';

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
      await this.getData();
      if (this.syncStatus === 'idle') {
        await this.loadChats();
        console.log('Chats loaded from database.');
      }
    });

    this.wpp.on('qr', async (qr) => {
      this.qrGeneratedAt = Date.now();
      await QRCode.toFile(`public/qr/${this.id}_qr.png`, qr);
    });

    this.wpp.on('authenticated', () => console.log(`Client ${this.id} authenticated`));

    this.wpp.on('disconnected', (reason) =>
      console.log(`Client ${this.id} was logged out`, reason),
    );

    this.wpp.on('message', async (message) => await this.saveMessage(message, 2));

    this.wpp.on(
      'message_create',
      async (message) => await this.saveMessage(message, 1),
    );

    this.wpp.on('message_edit', async (message) => await this.saveMessage(message, 4));

    this.wpp.on('message_revoke_everyone', async (message) => {
      await this.saveMessage(message, 5);
      const revoked_msg = message as unknown as {
        _data: { protocolMessageKey: MessageId };
      };
      await this.saveMessage(
        { ...message, id: revoked_msg._data.protocolMessageKey },
        7,
      );
    });

    this.wpp.on('vote_update', async (vote) => await this.saveVote(vote));
  }

  public async loadChats() {
    const clientWpp = this.getWpp();
    const [chats, database] = await Promise.all([
      clientWpp.getChats(),
      databasePromise,
    ]);

    await Promise.all([
      chats.map(async (ch) => {
        const chat = new RepoChat(true, ch.id._serialized, this.id);
        return await chat.save();
      }),
    ]);

    await database.updateIntoTable({
      table: 'clients',
      dataDict: { last_sync_at: dayLib().format('YYYY-MM-DD HH:mm:ss.SSS') },
      where: { id: this.id },
    });

    this.syncStatus = 'syncing';
  }

  private async saveMessage(messageData: Whatsapp.Message, statusId: number) {
    const chatId = messageData.id.remote;
    const msgId = messageData.id._serialized;

    const chat = new RepoChat(false, chatId, this.id);
    const msg = new RepoMessage(statusId, msgId, chatId, this.id);

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

  public async getData() {
    const database = await databasePromise;

    const [dataChatSync, dataMsgSync] = await Promise.all([
      database.query<{ count: number }>(
        'SELECT COUNT(*) FROM repo_chats WHERE is_sync = true',
      ),
      database.query<{ count: number }>(
        'SELECT COUNT(*) FROM repo_messages WHERE status_id = 6',
      ),
    ]);
    if (dataChatSync[0].count > 0 || dataMsgSync[0].count > 0) {
      this.syncStatus = 'syncing';
    } else {
      const data = await database.findFirst<IClient>({
        table: 'clients',
        where: { id: this.id },
        select: { last_sync_at: true },
      });

      if (data?.last_sync_at && dayLib().diff(data.last_sync_at, 'day') === 0) {
        this.syncStatus = 'synced';
      } else {
        this.syncStatus = 'idle';
      }
    }

    return { ...this.getInfo(), isReady: this.isReady, syncStatus: this.syncStatus };
  }

  public async getChats() {
    const data = await this.getData();

    const chats = await listChatByClientId(this.id);

    return { ...data, chats: chats.filter((ch) => ch.name.length > 2) };
  }
}

export default Client;
