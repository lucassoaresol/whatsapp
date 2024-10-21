import mime from 'mime-types';

import { IMedia } from '../interfaces/media';
import { IMessage } from '../interfaces/message';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';

import Chat from './chat';
import Media from './media';
import RepoChat from './repoChat';
import RepoMessage from './repoMessage';

class Message {
  private id!: string;
  private body!: string;
  private fromMe!: boolean;
  private statusId!: number;
  private chatId!: number;
  private fromId?: string;
  private mediaId?: number;
  private createdAt!: string;

  constructor(private repoMessage: RepoMessage) {}

  private async getMessageData() {
    let isValid = false;
    if (this.statusId === 7) {
      const database = await databasePromise;
      await database.deleteFromTable({ table: 'messages', where: { id: this.id } });
    } else {
      const dataRepo = this.repoMessage.getData();
      const clientWpp = await this.repoMessage.getClientWPP();
      if (clientWpp) {
        const today = dayLib();
        const [chat, msg] = await Promise.all([
          clientWpp.getChatById(dataRepo.chatId),
          clientWpp.getMessageById(dataRepo.msgId),
        ]);
        const timestamp = dayLib(msg.timestamp * 1000).format(
          'YYYY-MM-DD HH:mm:ss.SSS',
        );
        if (timestamp !== 'Invalid Date') {
          isValid = true;
          this.id = dataRepo.msgId;
          this.body = msg.body;
          this.fromMe = msg.fromMe;
          this.createdAt = timestamp;

          if (dataRepo.statusId === 6) {
            if (msg.latestEditMsgKey) {
              this.statusId = 4;
            } else if (msg.type === 'revoked') {
              this.statusId = 5;
            } else {
              this.statusId = 3;
            }
          } else {
            this.statusId = dataRepo.statusId;
          }

          const repoChat = new RepoChat(false, dataRepo.chatId, dataRepo.clientId);

          const chatData = new Chat(repoChat);

          await chatData.save();
          this.chatId = await repoChat.saveClientChat();

          if (chat.isGroup && !msg.fromMe) {
            const from = await msg.getContact();
            this.fromId = from.id._serialized;
            const repoChatFrom = new RepoChat(false, this.fromId, dataRepo.clientId);

            const chatFrom = new Chat(repoChatFrom);

            await chatFrom.save();
          }

          if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            const mimeType = media.mimetype;
            const extension = mime.extension(mimeType);
            const fileName = `${dataRepo.clientId}_${Date.now()}.${extension}`;
            const path = `media/${fileName}`;
            const mediaData = new Media(mimeType, media.data, path);
            this.mediaId = await mediaData.save();
            if (today.diff(timestamp, 'd') < 6) {
              await mediaData.down();
            }
          }
        }
      }
    }
    return isValid;
  }

  public async save() {
    const [database, isValid] = await Promise.all([
      databasePromise,
      this.getMessageData(),
    ]);

    if (isValid) {
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
  }

  public async destroy() {
    const database = await databasePromise;
    if (this.mediaId) {
      const mediaData = await database.findFirst<IMedia>({
        table: 'medias',
        where: { id: this.mediaId },
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
