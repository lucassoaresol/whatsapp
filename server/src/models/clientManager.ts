import { IClient } from '../interfaces/client';
import databasePromise from '../libs/database';

import Client from './client';

class ClientManager {
  private static instance: ClientManager;
  private clients: Map<string, Client> = new Map();

  private constructor() {}

  public static async getInstance(): Promise<ClientManager> {
    if (!ClientManager.instance) {
      ClientManager.instance = new ClientManager();
    }
    await ClientManager.instance.loadDataFromDatabase();
    return ClientManager.instance;
  }

  private async loadDataFromDatabase() {
    try {
      const database = await databasePromise;

      const resultClient = await database.findMany<IClient>({ table: 'clients' });
      const clientIds = resultClient.map((row) => row.id);

      for (const id of clientIds) {
        await this.addClient(id, false);
      }
    } catch (error) {
      console.error('Error loading clients from database:', error);
    }
  }

  public async addClient(id: string, save = true) {
    if (this.clients.has(id)) {
      console.log(`Client with ID ${id} already exists.`);
      return;
    }

    const client = new Client(id);
    this.clients.set(id, client);
    await client.start();
    if (save) await client.save();
    console.log(`Client with ID ${id} has been added and started.`);
  }

  public getClient(id: string): Client | undefined {
    return this.clients.get(id);
  }

  public async removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      this.clients.delete(id);
      console.log(`Client with ID ${id} has been removed.`);
    } else {
      console.log(`Client with ID ${id} not found.`);
    }
  }

  public async listClients() {
    const clientsDataPromises = Array.from(this.clients.values()).map(
      async (client) => await client.getChats(),
    );
    return await Promise.all(clientsDataPromises);
  }

  public getClients() {
    return Array.from(this.clients.values());
  }
}

export const ClientManagerPromise: Promise<ClientManager> = (async () => {
  try {
    const clientsManager = await ClientManager.getInstance();
    return clientsManager;
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
})();

export default ClientManager;
