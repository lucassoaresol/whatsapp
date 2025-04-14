import { Queue, Worker } from 'bullmq';

import { IRepoChat } from '../../interfaces/chat';
import RepoChat from '../../models/repoChat';

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
