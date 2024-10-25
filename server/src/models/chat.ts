import { Chat as ChatWpp, GroupParticipant } from 'whatsapp-web.js';

import { IChat, IGroup } from '../interfaces/chat';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';

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

  private async addPartGroup(chat_id: string) {
    const dataRepo = this.repoChat.getData();
    const database = await databasePromise;

    const chatData = await database.findFirst({
      table: 'repo_chats',
      where: { group_id: dataRepo.chatId, chat_id },
    });

    if (!chatData) {
      const repoChatPr = new RepoChat(
        dataRepo.isSync,
        chat_id,
        dataRepo.clientId,
        dataRepo.chatId,
      );

      return await repoChatPr.save();
    }
  }

  private async getChatGroupData(chat: ChatWpp) {
    const dataRepo = this.repoChat.getData();
    const database = await databasePromise;

    const chatData = chat as unknown as {
      groupMetadata: { participants: GroupParticipant[] };
    };

    if (chatData.groupMetadata.participants) {
      const participants = chatData.groupMetadata.participants;

      const participantsData = await database.findMany<IGroup>({
        table: 'groups_chats',
        where: { group_id: dataRepo.chatId },
        select: { chat_id: true },
      });

      const missingParticipants = participantsData.filter(
        (pData) => !participants.some((p) => p.id._serialized === pData.chat_id),
      );

      const addParticipants = participants.filter(
        (pData) => !participantsData.some((p) => p.chat_id === pData.id._serialized),
      );

      await Promise.all(
        addParticipants.map(async (aP) => await this.addPartGroup(aP.id._serialized)),
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

  private async process(chatData: IChat | null) {
    const dataRepo = this.repoChat.getData();
    const [database] = await Promise.all([databasePromise, this.getChatData()]);

    if (this.isValid) {
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

      if (dataRepo.groupId) {
        await this.addGroup(dataRepo.groupId, dataRepo.chatId);
      } else {
        this.isSaved = true;
      }
    }
  }

  public async save() {
    const dataRepo = this.repoChat.getData();
    const database = await databasePromise;

    const chatData = await database.findFirst<IChat>({
      table: 'chats',
      where: { id: dataRepo.chatId },
      select: { name: true, profile_pic_url: true, updated_at: true },
    });

    if (dataRepo.isSync) {
      await this.process(chatData);
    } else if (chatData) {
      const updatedAt = dayLib(chatData.updated_at);
      if (dayLib().diff(updatedAt, 'm') > 15) {
        await this.process(chatData);
      } else {
        this.isSaved = true;
      }
    } else {
      await this.process(chatData);
    }

    return this.isSaved;
  }
}

export default Chat;
