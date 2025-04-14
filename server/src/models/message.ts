import mime from 'mime-types';

import { IClientChatWithChat } from '../interfaces/chat';
import { IMedia } from '../interfaces/media';
import { IMessage } from '../interfaces/message';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import { chatQueue } from '../worker/services/chat';

import Media from './media';
import RepoMessage from './repoMessage';

class Message {
  private isValid = false;
  private isSaved = false;

  private id!: string;
  private type!: string;
  private body!: string;
  private fromMe!: boolean;
  private statusId!: number;
  private chatId!: number;
  private fromId?: string;
  private mediaId?: number;
  private createdAt!: string;

  constructor(private repoMessage: RepoMessage) {}

  private async getMessageData() {
    const database = await databasePromise;
    const dataRepo = this.repoMessage.getData();

    const dataMsg = await database.findFirst<IMessage>({
      table: 'messages',
      where: { id: dataRepo.msgId },
      select: { id: true, media_id: true },
    });

    if (dataRepo.statusId === 6 && dataMsg) {
      this.id = dataMsg.id;
      this.mediaId = dataMsg.media_id;
      await this.destroy();
      this.isSaved = true;
    } else if (!dataMsg) {
      const clientWpp = await this.repoMessage.getClientWPP();
      if (clientWpp) {
        const today = dayLib();
        const msg = await clientWpp.getMessageById(dataRepo.msgId);
        if (msg) {
          const timestamp = dayLib(msg.timestamp * 1000).format(
            'YYYY-MM-DD HH:mm:ss.SSS',
          );
          if (timestamp !== 'Invalid Date') {
            this.id = dataRepo.msgId;
            this.statusId = dataRepo.statusId;
            this.type = msg.type;
            this.body = msg.body;
            this.fromMe = msg.fromMe;
            this.createdAt = timestamp;

            const chatData = await database.findFirst<IClientChatWithChat>({
              table: 'clients_chats',
              where: { client_id: dataRepo.clientId, chat_id: dataRepo.chatId },
              joins: [{ table: 'chats', alias: 'c', on: { chat_id: 'id' } }],
              select: { id: true, 'c.is_group': true },
            });

            if (chatData) {
              this.isValid = true;
              this.chatId = chatData.id;

              if (chatData.c_is_group && !msg.fromMe) {
                const from = await msg.getContact();
                this.fromId = from.id._serialized;

                const chatFrom = await database.findFirst({
                  table: 'chats',
                  where: { id: this.fromId },
                  select: { id: true },
                });

                if (chatFrom) {
                  this.isValid = true;
                } else {
                  await chatQueue.add(
                    'save-chat',
                    {
                      chat_id: this.fromId,
                      client_id: dataRepo.clientId,
                      group_id: dataRepo.chatId,
                    },
                    { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
                  );
                  this.isValid = false;
                }
              }

              if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                if (media) {
                  const mimeType = media.mimetype;
                  const extension = mime.extension(mimeType);
                  const fileName = `${dataRepo.clientId}_${Date.now()}.${extension}`;
                  const path = `media/${fileName}`;
                  const mediaData = new Media(mimeType, media.data, path);
                  this.mediaId = await mediaData.save();
                  if (today.diff(timestamp, 'd') <= 10) {
                    await mediaData.down();
                  }
                } else {
                  this.statusId = 7;
                }
              }
            }
          }
        }
      }
    }
    this.isSaved = true;
  }

  public async save() {
    const [database] = await Promise.all([databasePromise, this.getMessageData()]);

    if (this.isValid) {
      const msgData = await database.findFirst<IMessage>({
        table: 'messages',
        where: { id: this.id },
        select: { status_id: true },
      });

      if (msgData) {
        if (msgData.status_id !== this.statusId) {
          await database.updateIntoTable({
            table: 'messages',
            dataDict: { status_id: this.statusId, body: this.body },
            where: { id: this.id },
          });
        }
      } else {
        await database.insertIntoTable({
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
      this.isSaved = true;
    }
    return this.isSaved;
  }

  public async destroy() {
    const database = await databasePromise;
    if (this.mediaId) {
      const mediaData = await database.findFirst<IMedia>({
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
    } else {
      await database.deleteFromTable({ table: 'messages', where: { id: this.id } });
    }
  }
}

export default Message;
