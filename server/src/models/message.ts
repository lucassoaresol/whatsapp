import mime from 'mime-types';

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
  private isNew?: boolean;
  private createdAt!: string;
  private chatId!: number;
  private fromId?: string;
  private mediaId?: number;

  constructor(private repoMessage: RepoMessage) {}

  private async getMessageData() {
    let isValid = false;
    const dataRepo = this.repoMessage.getData();
    const clientWpp = await this.repoMessage.getClientWPP();
    if (clientWpp) {
      const today = dayLib();
      const [chat, msg] = await Promise.all([
        clientWpp.getChatById(dataRepo.chatId),
        clientWpp.getMessageById(dataRepo.msgId),
      ]);
      const timestamp = dayLib(msg.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss.SSS');
      if (timestamp !== 'Invalid Date') {
        isValid = true;
        this.id = dataRepo.msgId;
        this.body = msg.body;
        this.fromMe = msg.fromMe;
        this.isNew = dataRepo.isNew;
        this.createdAt = timestamp;

        const repoChat = new RepoChat(false, dataRepo.chatId, dataRepo.clientId);

        const chatData = new Chat(repoChat);

        await chatData.save();
        this.chatId = await repoChat.saveClientChat();

        if (chat.isGroup && !msg.fromMe && msg.id.participant) {
          this.fromId = msg.id.participant._serialized;
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
    return isValid;
  }

  public async save() {
    const [database, isValid] = await Promise.all([
      databasePromise,
      this.getMessageData(),
    ]);

    if (isValid) {
      await database.insertIntoTable({
        table: 'messages',
        dataDict: {
          id: this.id,
          body: this.body,
          from_me: this.fromMe,
          is_new: this.isNew,
          created_at: this.createdAt,
          chat_id: this.chatId,
          from_id: this.fromId,
          media_id: this.mediaId,
        },
      });
    }
  }
}

export default Message;
