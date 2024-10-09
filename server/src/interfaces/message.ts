import { MessageId } from 'whatsapp-web.js';

export interface IMessageWpp {
  id: MessageId;
  fromMe: boolean;
  timestamp: number;
}

export interface IMessage {
  id: string;
  data: IMessageWpp;
  from_me: boolean;
  is_new: boolean;
  created_at: Date;
  chat_id: string;
  client_id: string;
}

export interface IRepoMessage {
  id: number;
  msg_id: string;
  data: any;
  from_me: boolean;
  chat_id: string;
  client_id: string;
}
