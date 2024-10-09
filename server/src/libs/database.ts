import { ClientsManager, Database } from 'pg-utils';

const databasePromise: Promise<Database> = (async () => {
  try {
    const clientsManager = await ClientsManager.getInstance();
    const client = clientsManager.getClientById('whatsapp');
    if (!client) {
      throw new Error('Cliente com ID "whatsapp" não encontrado na configuração.');
    }
    return client.getClientDatabase();
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
})();

export default databasePromise;
