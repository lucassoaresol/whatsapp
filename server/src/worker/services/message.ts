import { Queue, Worker } from 'bullmq';

import { IRepoMessage } from '../../interfaces/message';
import RepoMessage from '../../models/repoMessage';

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
    await repoMessage.save();
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 2,
    prefix: 'whatsapp',
  },
);
