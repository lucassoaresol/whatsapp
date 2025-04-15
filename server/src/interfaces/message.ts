export interface IMessage {
  id: string;
  body: string;
  from_me: boolean;
  status_id: number;
  chat_id: number;
  from_id?: string;
  media_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface IRepoMessage {
  status_id: number;
  msg_id: string;
  chat_id: string;
  client_id: string;
}

export interface IMessageWpp {
  id: string;
  timestamp?: string;
  type: string;
  body: string;
  fromMe: boolean;
  hasMedia: boolean;
}
