export interface IClient {
  id: string;
  created_at: Date;
  last_sync_at?: Date;
}
