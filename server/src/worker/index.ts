import { chatWorker } from "./services/chat";
import { messageWorker } from "./services/message";
import { voteWorker } from "./services/vote";

chatWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CHAT] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

chatWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CHAT] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

messageWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [MESSAGE] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

messageWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [MESSAGE] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

voteWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [VOTE] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

voteWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [VOTE] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
