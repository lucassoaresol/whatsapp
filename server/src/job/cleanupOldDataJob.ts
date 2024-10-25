import { CronJob } from 'cron';

import { deleteOldMedias } from '../utils/deleteOldMedias';
import { deleteOldVotes } from '../utils/deleteOldVotes';

CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => {
    await Promise.all([deleteOldMedias(), deleteOldVotes()]);
  },
  start: true,
});
