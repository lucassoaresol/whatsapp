import { Database } from 'pg-utils';

import { IChat, IClientChat, IGroup } from '../interfaces/chat';
import { retriveChatWpp } from '../libs/axios';
import databasePromise from '../libs/database';
import { chatQueue } from '../worker/services/chat';

class Chat {
  private id!: string;
  private name!: string;
  private isGroup!: boolean;
  private unreadCount!: number;
  private profilePicUrl?: string;
  private participants?: string[];
  private database!: Database;

  constructor(
    private chatId: string,
    private clientId: string,
    private groupId?: string,
  ) {}

  private async addGroup(group_id: string, chat_id: string) {
    const group = await this.database.findFirst({
      table: 'chats',
      where: { id: group_id },
      select: { id: true },
    });

    if (group) {
      const groupChat = await this.database.findFirst<IGroup>({
        table: 'groups_chats',
        where: { group_id, chat_id },
        select: { id: true },
      });
      if (!groupChat) {
        await this.database.insertIntoTable({
          table: 'groups_chats',
          dataDict: { group_id, chat_id },
        });
      }
    } else {
      throw new Error('group not found');
    }
  }

  private async removeGroup(group_id: string, chat_id: string) {
    await this.database.deleteFromTable({
      table: 'groups_chats',
      where: { group_id, chat_id },
    });
  }

  private async getChatGroupData() {
    const participants = this.participants ? this.participants : [];

    const participantsData = await this.database.findMany<IGroup>({
      table: 'groups_chats',
      where: { group_id: this.id },
      select: { chat_id: true },
    });

    const missingParticipants = participantsData.filter(
      (pData) => !participants.some((p) => p === pData.chat_id),
    );

    const addParticipants = participants.filter(
      (pData) => !participantsData.some((p) => p.chat_id === pData),
    );

    await Promise.all(
      addParticipants.map(
        async (aP) =>
          await chatQueue.add(
            'save-chat',
            {
              chat_id: aP,
              client_id: this.clientId,
              group_id: this.id,
            },
            { attempts: 1000, backoff: { type: 'exponential', delay: 5000 } },
          ),
      ),
    );

    await Promise.all(
      missingParticipants.map(
        async (mP) => await this.removeGroup(this.id, mP.chat_id),
      ),
    );
  }

  private async getChatData() {
    const chatWpp = await retriveChatWpp(this.clientId, this.chatId);

    if (chatWpp) {
      const { id, isGroup, name, unreadCount, participants, profilePicUrl } = chatWpp;
      this.id = id;
      this.name = name || '';
      this.isGroup = isGroup;
      this.unreadCount = unreadCount;
      this.profilePicUrl = profilePicUrl;
      this.participants = participants;

      if (this.isGroup) {
        await this.getChatGroupData();
      }
    } else {
      throw new Error('chat wpp not found');
    }
  }

  private async process(chatData?: IChat) {
    await this.getChatData();

    if (chatData) {
      if (
        (this.name || this.profilePicUrl) &&
        (chatData.name !== this.name || chatData.profile_pic_url !== this.profilePicUrl)
      ) {
        await this.database.updateIntoTable({
          table: 'chats',
          dataDict: { name: this.name, profile_pic_url: this.profilePicUrl },
          where: { id: this.id },
        });
      }
    } else {
      await this.database.insertIntoTable({
        table: 'chats',
        dataDict: {
          id: this.id,
          name: this.name,
          is_group: this.isGroup,
          profile_pic_url: this.profilePicUrl,
        },
      });
    }
    if (this.groupId) {
      await this.addGroup(this.groupId, this.id);
    }
  }

  public async save() {
    this.database = await databasePromise;

    const chatData = await this.database.findFirst<IChat>({
      table: 'chats',
      where: { id: this.chatId },
      select: { name: true, profile_pic_url: true, updated_at: true },
    });

    if (chatData) {
      await this.process(chatData);
      if (this.groupId) {
        await this.addGroup(this.groupId, this.chatId);
      }
    } else {
      await this.process();
    }

    if (!this.groupId) {
      await this.saveClientChat();
    }
  }

  private async saveClientChat() {
    const clientChat = await this.database.findFirst<IClientChat>({
      table: 'clients_chats',
      where: { client_id: this.clientId, chat_id: this.chatId },
      select: { id: true },
    });

    if (clientChat) {
      await this.database.updateIntoTable({
        table: 'clients_chats',
        dataDict: { unread_count: this.unreadCount },
        where: { id: clientChat.id },
      });
    } else {
      await this.database.insertIntoTable({
        table: 'clients_chats',
        dataDict: {
          client_id: this.clientId,
          chat_id: this.chatId,
          unread_count: this.unreadCount,
        },
      });
    }
  }
}

export default Chat;
