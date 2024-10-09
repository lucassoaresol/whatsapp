import { CronJob } from 'cron';

import { deleteOldMessages } from '../utils/deleteOldMessages';
import { deleteOldVotes } from '../utils/deleteOldVotes';

CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => {
    await Promise.all([deleteOldMessages(), deleteOldVotes()]);
  },
  start: true,
});
