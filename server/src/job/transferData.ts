import { CronJob } from 'cron';
import { Dayjs } from 'dayjs';

import dayLib from '../libs/dayjs';
import RepoChatManager from '../models/repoChatManager';
import RepoMessageManager from '../models/repoMessageManager';

let isRunning = false;
let lastLogTime: Dayjs | null = null;
const jobName = 'CarregarDados';
const chatManager = new RepoChatManager();
const repoMessage = new RepoMessageManager();

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
      await Promise.all([
        chatManager.loadDataFromDatabase(),
        repoMessage.loadDataFromDatabase(),
      ]);
      console.info(
        `[INFO - ${now.format('YYYY-MM-DD HH:mm:ss')}] [${jobName}] Dados carregados com sucesso.`,
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
