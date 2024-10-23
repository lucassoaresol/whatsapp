import databasePromise from '../libs/database';

async function databaseInit() {
  try {
    const database = await databasePromise;

    const STATUS_TYPES = [
      { id: 1, name: 'created' },
      { id: 2, name: 'received' },
      { id: 3, name: 'read' },
      { id: 4, name: 'edited' },
      { id: 5, name: 'deleted' },
      { id: 6, name: 'history' },
      { id: 7, name: 'pending deletion' },
      { id: 8, name: 'media unavailable' },
    ];

    const existingStatuses = await database.findMany<{ name: string }>({
      table: 'status_types',
      select: { name: true },
    });

    const existingStatusNames = existingStatuses.map((row) => row.name);

    const statusesToInsert = STATUS_TYPES.filter(
      (status) => !existingStatusNames.includes(status.name),
    );

    if (statusesToInsert.length > 0) {
      for (const status of statusesToInsert) {
        await database.insertIntoTable({
          table: 'status_types',
          dataDict: status,
        });
      }
      console.log('Status inseridos com sucesso:', statusesToInsert);
    } else {
      console.log('Nenhum novo status para inserir.');
    }
  } catch (error) {
    console.error('Erro ao inicializar a base de dados:', error);
  }
}

databaseInit();
