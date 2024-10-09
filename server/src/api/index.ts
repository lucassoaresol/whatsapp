import { env } from '../config/env.js';

import app from './app.js';

async function startServer() {
  try {
    app.listen(env.port, () => console.log(`Servidor iniciado na porta ${env.port}`));
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
}

startServer();
