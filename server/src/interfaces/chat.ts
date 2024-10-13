import { IMessageReturnWpp } from './message';

export interface IChat {
  id: string;
  name: string;
  is_group: boolean;
  client_id: string;
  profile_pic_url?: string;
}

export interface IClientChat {
  key: number;
  client_id: string;
  chat_id: string;
}

export interface IChatReturnWpp {
  id: string;
  name: string;
  isGroup: boolean;
  profilePicUrl: string | null;
  unreadCount: number;
  date: string;
  dateDisplay: string;
  hour: string;
  messages: IMessageReturnWpp[];
}
