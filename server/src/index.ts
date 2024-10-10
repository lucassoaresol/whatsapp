import app from './api';
import { env } from './config/env';
import './job';
import { getClientManager } from './models/clientManager';

async function startServer() {
  try {
    await getClientManager();
    console.log('Clients loaded from database.');

    app.listen(env.port, () => console.log(`Servidor iniciado na porta ${env.port}`));
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

startServer();
