import { CronJob } from 'cron';
import { Dayjs } from 'dayjs';

import dayLib from '../libs/dayjs';
import RepoMessageManager from '../models/repoMessageManager';

let isRunning = false;
let lastLogTime: Dayjs | null = null;
const jobName = 'CarregarDadosChatManager';

CronJob.from({
  cronTime: '*/3 * * * * *',
  onTick: async () => {
    const now = dayLib();

    if (isRunning) {
      if (!lastLogTime || now.diff(lastLogTime, 'seconds') >= 60) {
        console.info(
          `[INFO - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Job já está em execução, ignorando nova execução.`,
        );
        lastLogTime = now;
      }
      return;
    }

    isRunning = true;
    console.info(
      `[INFO - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Job iniciado.`,
    );

    try {
      const repoMessage = new RepoMessageManager();
      await repoMessage.loadDataFromDatabase();
      console.log(
        `[INFO - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Mensagens transferidas com sucesso.`,
      );
    } catch (error) {
      console.error(
        `[ERROR - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Erro durante a execução do job:`,
        error,
      );
    } finally {
      isRunning = false;
      console.info(
        `[INFO - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Job finalizado.`,
      );
    }
  },
  start: true,
});
