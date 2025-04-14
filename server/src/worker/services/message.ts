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
    const isSaved = await repoMessage.save();
    if (!isSaved) {
      throw new Error('Falha ao salvar a mensagem. Tentando novamente...');
    }
  },
  { connection: {}, concurrency: 2, prefix: 'whatsapp' },
);
