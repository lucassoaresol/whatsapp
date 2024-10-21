import databasePromise from '../libs/database';

async function databaseInit() {
  try {
    const database = await databasePromise;

    const STATUS_TYPES = [
      'created',
      'received',
      'read',
      'edited',
      'deleted',
      'history',
      'pending deletion',
      'media unavailable',
    ];

    const existingStatuses = await database.findMany<{ name: string }>({
      table: 'status_types',
      select: { name: true },
    });

    const existingStatusNames = existingStatuses.map((row) => row.name);

    const statusesToInsert = STATUS_TYPES.filter(
      (status) => !existingStatusNames.includes(status),
    );

    if (statusesToInsert.length > 0) {
      for (const status of statusesToInsert) {
        await database.insertIntoTable({
          table: 'status_types',
          dataDict: { name: status },
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
