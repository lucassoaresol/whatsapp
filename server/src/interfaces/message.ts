export interface IMessage {
  id: string;
  body: string;
  from_me: boolean;
  is_new: boolean;
  mime_types?: string;
  created_at: Date;
  chat_id: number;
  from_id?: string;
  image_id?: number;
}

export interface IRepoMessage {
  id: number;
  is_new: boolean;
  msg_id: string;
  chat_id: string;
  client_id: string;
}
