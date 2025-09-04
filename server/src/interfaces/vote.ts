export interface IVote {
  id: number;
  selected_name: number;
  is_new: true;
  chat_id: number;
  created_at: Date;
}

export interface IRepoVote {
  selected_name: string;
  chat_id: string;
  message_id: string;
  client_id: string;
}
