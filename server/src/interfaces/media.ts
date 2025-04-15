export interface IMedia {
  id: number;
  mime_type: string;
  data: string;
  path: string;
  is_down: boolean;
}

export interface IMediaWpp {
  mimeType: string;
  fileName: string;
  data: string;
}
