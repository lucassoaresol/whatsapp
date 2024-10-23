import { IChat } from '../interfaces/chat';
import databasePromise from '../libs/database';

import RepoChat from './repoChat';

class Chat {
  private isValid = false;
  private isSaved = false;

  private id!: string;
  private name!: string;
  private isGroup!: boolean;
  private profilePicUrl?: string;

  constructor(private repoChat: RepoChat) {}

  private async getChatData() {
    const dataRepo = this.repoChat.getData();
    const clientWpp = await this.repoChat.getClientWPP();
    if (clientWpp) {
      this.isValid = true;
      const chat = await clientWpp.getChatById(dataRepo.chatId);
      this.id = dataRepo.chatId;
      this.isGroup = chat.isGroup;
      let name = chat.name;

      if (this.id.length > 7) {
        const contact = await clientWpp.getContactById(this.id);
        this.profilePicUrl = await contact.getProfilePicUrl();
        if (!this.isGroup) {
          name = contact.pushname;
        }

        if (!name) {
          name = contact.name || contact.number;
        }
      }

      if (!name) {
        name = '';
      }

      this.name = name;
    }
  }

  public async save() {
    const [database] = await Promise.all([databasePromise, this.getChatData()]);

    if (this.isValid) {
      const chatData = await database.findFirst<IChat>({
        table: 'chats',
        where: { id: this.id },
        select: { name: true, profile_pic_url: true },
      });

      if (chatData) {
        if (
          chatData.name !== this.name ||
          chatData.profile_pic_url !== this.profilePicUrl
        ) {
          await database.updateIntoTable({
            table: 'chats',
            dataDict: { name: this.name, profile_pic_url: this.profilePicUrl },
            where: { id: this.id },
          });
        }
      } else {
        await database.insertIntoTable({
          table: 'chats',
          dataDict: {
            id: this.id,
            name: this.name,
            is_group: this.isGroup,
            profile_pic_url: this.profilePicUrl,
          },
        });
      }
      this.isSaved = true;
    }

    return this.isSaved;
  }
}

export default Chat;
