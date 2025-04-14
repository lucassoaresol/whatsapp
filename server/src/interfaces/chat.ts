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
  id: number;
  client_id: string;
  chat_id: string;
  unread_count: number;
}

export interface IClientChatWithChat extends IClientChat {
  c_is_group: boolean;
  c_id: string;
  c_name: string;
  c_profile_pic_url: string;
}

export interface IChatWithMessages extends IChat {
  unread_count: number;
  date: string;
  date_display: string;
  hour: string;
}

export interface IRepoChat {
  group_id?: string;
  chat_id: string;
  client_id: string;
}

export interface IGroup {
  id: number;
  group_id: string;
  chat_id: string;
}
