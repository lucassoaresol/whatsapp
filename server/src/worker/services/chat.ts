import { Queue, Worker } from 'bullmq';

import { IRepoChat } from '../../interfaces/chat';
import Chat from '../../models/chat';

export const chatQueue = new Queue<IRepoChat>('chat-queue', {
  connection: {},
  prefix: 'whatsapp',
});

export const chatWorker = new Worker<IRepoChat>(
  'chat-queue',
  async (job) => {
    const repoChat = new Chat(job.data.chat_id, job.data.client_id, job.data.group_id);
    await repoChat.save();
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 5,
    prefix: 'whatsapp',
  },
);
