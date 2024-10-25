import { Chat as ChatWpp, GroupParticipant } from 'whatsapp-web.js';

import { IChat, IGroup } from '../interfaces/chat';
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

  private async addGroup(group_id: string, chat_id: string) {
    const database = await databasePromise;

    const group = await database.findFirst({
      table: 'chats',
      where: { id: group_id },
      select: { id: true },
    });

    if (group) {
      const groupChat = await database.findFirst<IGroup>({
        table: 'groups_chats',
        where: { group_id, chat_id },
        select: { key: true },
      });
      if (!groupChat) {
        await database.insertIntoTable({
          table: 'groups_chats',
          dataDict: { group_id, chat_id },
        });
      }
      this.isSaved = true;
    } else {
      this.isSaved = false;
    }
  }

  private async removeGroup(group_id: string, chat_id: string) {
    const database = await databasePromise;

    await database.deleteFromTable({
      table: 'groups_chats',
      where: { group_id, chat_id },
    });
  }

  private async getChatGroupData(chat: ChatWpp) {
    const dataRepo = this.repoChat.getData();
    const database = await databasePromise;

    const chatData = chat as unknown as {
      groupMetadata: { participants: GroupParticipant[] };
    };

    if (chatData.groupMetadata.participants) {
      const participants = chatData.groupMetadata.participants;

      await Promise.all(
        participants.map(async (pr) => {
          const repoChatPr = new RepoChat(
            false,
            pr.id._serialized,
            dataRepo.clientId,
            dataRepo.chatId,
          );
          return await repoChatPr.save();
        }),
      );

      const participantsData = await database.findMany<IGroup>({
        table: 'groups_chats',
        where: { group_id: dataRepo.chatId },
        select: { chat_id: true },
      });

      const missingParticipants = participantsData.filter(
        (pData) => !participants.some((p) => p.id._serialized === pData.chat_id),
      );

      await Promise.all(
        missingParticipants.map(
          async (mP) => await this.removeGroup(dataRepo.chatId, mP.chat_id),
        ),
      );
    }
  }

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

      if (this.isGroup) {
        await this.getChatGroupData(chat);
      }
    }
  }

  public async save() {
    const dataRepo = this.repoChat.getData();
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

      if (dataRepo.groupId) {
        await this.addGroup(dataRepo.groupId, dataRepo.chatId);
      } else {
        this.isSaved = true;
      }
    }

    return this.isSaved;
  }
}

export default Chat;
