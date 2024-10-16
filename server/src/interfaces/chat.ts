import { IMessageDetails } from './message';

export interface IChat {
  id: string;
  name: string;
  is_group: boolean;
  profile_pic_url: string | null;
}

export interface IChatWithClient extends IChat {
  client_id: string;
}

export interface IClientChat {
  key: number;
  client_id: string;
  chat_id: string;
}

export interface IChatWithMessages extends IChat {
  unread_count: number;
  date: string;
  date_display: string;
  hour: string;
  messages: IMessageDetails[];
}
