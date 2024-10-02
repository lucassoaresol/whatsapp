import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MigrationCreator {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = join(__dirname, '../../migrations');
  }

  public async createMigrationFile(name: string) {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '');
    const fileName = `${timestamp}_${name.replace(/\s+/g, '_')}.sql`;
    const filePath = join(this.migrationsPath, fileName);

    const fileContent = `-- up

-- down
`;

    try {
      await writeFile(filePath, fileContent);
      console.log(`Migração criada com sucesso: ${filePath}`);
    } catch (err) {
      console.error('Erro ao criar a migração:', err);
    }
  }
}

export default MigrationCreator;
