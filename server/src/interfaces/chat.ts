export interface IChat {
  id: string;
  name: string;
  is_group: boolean;
  profile_pic_url?: string;
  created_at: string;
  updated_at: string;
}

export interface IChatWithClient extends IChat {
  client_id: string;
}

export interface IClientChat {
  key: number;
  client_id: string;
  chat_id: string;
  unread_count: number;
}

export interface IChatWithMessages extends IChat {
  unread_count: number;
  date: string;
  date_display: string;
  hour: string;
}

export interface IRepoChat {
  id: number;
  is_sync: boolean;
  chat_id: string;
  client_id: string;
}
