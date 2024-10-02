import Database from './database';
import MigrationCreator from './migrationCreator';
import MigrationManager from './migrationManager';

async function main() {
  const direction = process.argv[2];
  const migrationName = process.argv.slice(3).join(' ');
  const manager = new MigrationManager();
  const creator = new MigrationCreator();

  try {
    await manager.initialize();

    if (direction === 'up') {
      await manager.applyAllMigrations();
    } else if (direction === 'down') {
      await manager.revertLastMigration();
    } else if (direction === 'create') {
      if (!migrationName) {
        console.error('Por favor, forneça um nome para a migração.');
        process.exit(1);
      }
      await creator.createMigrationFile(migrationName);
    } else {
      console.error('Comando desconhecido. Use "up", "down" ou "create".');
    }
  } catch (err) {
    console.error('Erro ao gerenciar migrações:', err);
  } finally {
    const pool = Database.getPool();
    await pool.end();
  }
}

main();
