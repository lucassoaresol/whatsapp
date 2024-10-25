import { CronJob } from 'cron';

import { deleteOldVotes } from '../utils/deleteOldVotes';
import { removeOldMedias } from '../utils/removeOldMedias';

CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => {
    await Promise.all([removeOldMedias(10), deleteOldVotes()]);
  },
  start: true,
});
