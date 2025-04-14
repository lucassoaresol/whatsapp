import { CronJob } from 'cron';

import { cleanOldFiles } from './jobs/cleanOldFiles';
import { deleteOldVotes } from './jobs/deleteOldVotes';
import { removeOldMedias } from './jobs/removeOldMedias';

CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => {
    await Promise.all([removeOldMedias(10), deleteOldVotes()]);
    cleanOldFiles('logs');
  },
  start: true,
});
