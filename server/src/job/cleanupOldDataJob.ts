import { CronJob } from 'cron';

import { deleteOldMedias } from '../utils/deleteOldMedias';
import { deleteOldMessages } from '../utils/deleteOldMessages';
import { deleteOldVotes } from '../utils/deleteOldVotes';

CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => {
    await Promise.all([deleteOldMessages(), deleteOldVotes(), deleteOldMedias()]);
  },
  start: true,
});
