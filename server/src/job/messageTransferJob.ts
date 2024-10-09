import { CronJob } from 'cron';

import RepoMessageManager from '../models/repoMessageManager';

let isRunning = false;

CronJob.from({
  cronTime: '*/3 * * * * *',
  onTick: async () => {
    if (isRunning) {
      console.log('Job já está em execução, ignorando a nova execução.');
      return;
    }

    isRunning = true;
    try {
      const repoMessage = new RepoMessageManager();
      await repoMessage.loadDataFromDatabase();
      await repoMessage.transferMessage();
    } catch (error) {
      console.error('Erro durante a execução do job:', error);
    } finally {
      isRunning = false;
    }
  },
  start: true,
});
