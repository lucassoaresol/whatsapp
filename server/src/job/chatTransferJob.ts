import { CronJob } from 'cron';

import { getChatManager } from '../models/chatManager';

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
      const chatManager = getChatManager();
      await chatManager.loadDataFromDatabase();
    } catch (error) {
      console.error('Erro durante a execução do job:', error);
    } finally {
      isRunning = false;
    }
  },
  start: true,
});
