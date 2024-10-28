import { chatWorker, messageWorker, voteWorker } from '../libs/bullmq';
import './cleanupOldDataJob';

chatWorker.on('completed', (job) => {
  console.log(`✅ [Sucesso] Tarefa ID ${job.id} processada com sucesso.`);
  console.log(`Detalhes do Job: Chat ID = ${job.data.chat_id}`);
});

chatWorker.on('failed', async (job, err) => {
  console.error(
    `❌ [Erro] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: Chat ID = ${job?.data.chat_id}`);
});

messageWorker.on('completed', (job) => {
  console.log(`✅ [Sucesso] Tarefa ID ${job.id} processada com sucesso.`);
  console.log(`Detalhes do Job: Message ID = ${job.data.msg_id}`);
});

messageWorker.on('failed', async (job, err) => {
  console.error(
    `❌ [Erro] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: Message ID = ${job?.data.msg_id}`);
});

voteWorker.on('completed', (job) => {
  console.log(`✅ [Sucesso] Tarefa ID ${job.id} processada com sucesso.`);
  console.log(
    `Detalhes do Job: Vote = ${job.data.selected_name}, Chat ID = ${job.data.chat_id}`,
  );
});

voteWorker.on('failed', async (job, err) => {
  console.error(
    `❌ [Erro] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(
    `Detalhes do Job: Vote = ${job?.data.selected_name}, Chat ID = ${job?.data.chat_id}`,
  );
});
