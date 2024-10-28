import { Queue, Worker } from 'bullmq';

import { IRepoChat } from '../interfaces/chat';
import { IRepoMessage } from '../interfaces/message';
import { IRepoVote } from '../interfaces/vote';
import RepoChat from '../models/repoChat';
import RepoMessage from '../models/repoMessage';
import RepoVote from '../models/repoVote';

export const chatQueue = new Queue<IRepoChat>('chat-queue', {
  connection: {},
  prefix: 'whatsapp',
});

export const chatWorker = new Worker<IRepoChat>(
  'chat-queue',
  async (job) => {
    const repoChat = new RepoChat(
      job.data.chat_id,
      job.data.client_id,
      job.data.group_id,
    );
    const isSaved = await repoChat.save();
    if (!isSaved) {
      throw new Error('Falha ao salvar o chat. Tentando novamente...');
    }
  },
  { connection: {}, concurrency: 5, prefix: 'whatsapp' },
);

export const messageQueue = new Queue<IRepoMessage>('message-queue', {
  connection: {},
  prefix: 'whatsapp',
});

export const messageWorker = new Worker<IRepoMessage>(
  'message-queue',
  async (job) => {
    const repoMessage = new RepoMessage(
      job.data.status_id,
      job.data.msg_id,
      job.data.chat_id,
      job.data.client_id,
    );
    const isSaved = await repoMessage.save();
    if (!isSaved) {
      throw new Error('Falha ao salvar a mensagem. Tentando novamente...');
    }
  },
  { connection: {}, concurrency: 2, prefix: 'whatsapp' },
);

export const voteQueue = new Queue<IRepoVote>('vote-queue', {
  connection: {},
  prefix: 'whatsapp',
});

export const voteWorker = new Worker<IRepoVote>(
  'vote-queue',
  async (job) => {
    const repoVote = new RepoVote(
      job.data.selected_name,
      job.data.chat_id,
      job.data.client_id,
    );
    const isSaved = await repoVote.save();
    if (!isSaved) {
      throw new Error('Falha ao salvar o voto. Tentando novamente...');
    }
  },
  { connection: {}, concurrency: 2, prefix: 'whatsapp' },
);
