import { Database } from 'pg-utils';

import { chatQueue } from '../worker/services/chat';
import { IClientChatWithChat } from '../interfaces/chat';
import { IMedia } from '../interfaces/media';
import { IMessage } from '../interfaces/message';
import { retriveMessageContactWpp, retriveMessageMediaWpp, retriveMessageWpp } from '../libs/axios';
import databaseWhatsappPromise from '../db/whatsapp';
import dayLib from '../libs/dayjs';

import Media from './media';

class Message {
  private id!: string;
  private type!: string;
  private body!: string;
  private fromMe!: boolean;
  private chatId!: number;
  private fromId?: string;
  private mediaId?: number;
  private createdAt!: string;
  private database!: Database;

  constructor(
    private statusId: number,
    private msgId: string,
    private chatIdWpp: string,
    private clientId: string,
  ) { }

  private async getMessageData() {
    this.database = await databaseWhatsappPromise;

    const dataMsg = await this.database.findFirst<IMessage>({
      table: 'messages',
      where: { id: this.msgId },
      select: { id: true, media_id: true },
    });

    if (this.statusId === 6) {
      if (dataMsg) {
        this.id = dataMsg.id;
        this.mediaId = dataMsg.media_id;
        await this.destroy();
      }
    } else {
      const today = dayLib();
      const msg = await retriveMessageWpp(this.clientId, this.msgId);
      if (msg) {
        if (msg.timestamp) {
          this.id = this.msgId;
          this.type = msg.type;
          this.body = msg.body;
          this.fromMe = msg.fromMe;
          this.createdAt = msg.timestamp;

          const chatData = await this.database.findFirst<IClientChatWithChat>({
            table: 'clients_chats',
            where: { client_id: this.clientId, chat_id: this.chatIdWpp },
            joins: [{ table: 'chats', alias: 'c', on: { chat_id: 'id' } }],
            select: { id: true, 'c.is_group': true },
          });

          if (chatData) {
            this.chatId = chatData.id;

            if (chatData.c_is_group && !msg.fromMe) {
              const from = await retriveMessageContactWpp(this.clientId, this.msgId);
              this.fromId = from.id;

              const chatFrom = await this.database.findFirst({
                table: 'chats',
                where: { id: this.fromId },
                select: { id: true },
              });

              if (!chatFrom) {
                await chatQueue.add(
                  'save-chat',
                  {
                    chat_id: this.fromId,
                    client_id: this.clientId,
                    group_id: this.chatIdWpp,
                  },
                  { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
                );
              }
            }

            if (msg.hasMedia) {
              const media = await retriveMessageMediaWpp(this.clientId, this.msgId);
              if (media) {
                const { data, fileName, mimeType } = media;
                const path = `media/${fileName}`;
                const mediaData = new Media(mimeType, data, path);
                this.mediaId = await mediaData.save();
                if (today.diff(msg.timestamp, 'd') <= 10) {
                  await mediaData.down();
                }
              } else {
                this.statusId = 7;
              }
            }
          } else {
            throw new Error('chat not found');
          }
        }
      }
    }
  }

  public async save() {
    await this.getMessageData();

    const msgData = await this.database.findFirst<IMessage>({
      table: 'messages',
      where: { id: this.id },
      select: { status_id: true },
    });

    if (msgData) {
      await this.database.updateIntoTable({
        table: 'messages',
        dataDict: { status_id: this.statusId, body: this.body },
        where: { id: this.id },
      });
    } else if (this.statusId !== 6) {
      await this.database.insertIntoTable({
        table: 'messages',
        dataDict: {
          id: this.id,
          type: this.type,
          body: this.body,
          from_me: this.fromMe,
          status_id: this.statusId,
          chat_id: this.chatId,
          from_id: this.fromId,
          media_id: this.mediaId,
          created_at: this.createdAt,
        },
      });
    }
  }

  private async destroy() {
    if (this.mediaId) {
      const mediaData = await this.database.findFirst<IMedia>({
        table: 'medias',
        where: { id: this.mediaId, is_down: true },
      });

      if (mediaData) {
        const media = new Media(
          mediaData.mime_type,
          mediaData.data,
          mediaData.path,
          this.mediaId,
        );

        await media.destroy();
      }
    }
    await this.database.deleteFromTable({
      table: 'messages',
      where: { id: this.id },
    });
  }
}

export default Message;
