import axios from 'axios';

import { env } from '../config/env.js';
import { IChatWpp } from '../interfaces/chat.js';
import { IMediaWpp } from '../interfaces/media.js';
import { IMessageWpp } from '../interfaces/message.js';

const apiUsingNow = axios.create({
  baseURL: `http://localhost:${env.port}`,
  timeout: 100000,
});

export const retriveChatWpp = async (clientId: string, chatId: string) => {
  const { data } = await apiUsingNow.get<IChatWpp>(`${clientId}/chats/${chatId}/wpp`);

  return data;
};

export const retriveMessageWpp = async (clientId: string, msgId: string) => {
  const { data } = await apiUsingNow.get<IMessageWpp>(`${clientId}/messages/${msgId}`);

  return data;
};

export const retriveMessageContactWpp = async (clientId: string, msgId: string) => {
  const { data } = await apiUsingNow.get<{ id: string }>(
    `${clientId}/messages/${msgId}/contact`,
  );

  return data;
};

export const retriveMessageMediaWpp = async (clientId: string, msgId: string) => {
  const { data } = await apiUsingNow.get<IMediaWpp>(
    `${clientId}/messages/${msgId}/media`,
  );

  return data;
};
