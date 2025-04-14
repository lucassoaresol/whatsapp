import { Queue, Worker } from 'bullmq';

import { IRepoVote } from '../../interfaces/vote';
import RepoVote from '../../models/repoVote';

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
    await repoVote.save();
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 2,
    prefix: 'whatsapp',
  },
);
