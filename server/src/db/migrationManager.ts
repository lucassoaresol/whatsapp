import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import Database from './database';

class MigrationManager {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = join(__dirname, '../../migrations');
  }

  public async initialize() {
    Database.connectPool();
    const pool = Database.getPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const pool = Database.getPool();
    const result = await pool.query(`SELECT name FROM "_migrations"`);
    return result.rows.map((row) => row.name);
  }

  private async applyMigration(fileName: string, direction: 'up' | 'down') {
    const filePath = join(this.migrationsPath, fileName);
    const fileContent = await readFile(filePath, 'utf-8');
    const [up, down] = fileContent.split('-- down');

    const sqlToExecute = direction === 'up' ? up.replace('-- up', '') : down;
    const pool = Database.getPool();

    await pool.query(sqlToExecute);

    if (direction === 'up') {
      await pool.query(`INSERT INTO "_migrations" (name) VALUES ($1)`, [fileName]);
    } else {
      await pool.query(`DELETE FROM "_migrations" WHERE name = $1`, [fileName]);
    }
  }

  public async applyAllMigrations() {
    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = await readdir(this.migrationsPath);
    const pendingMigrations = allMigrations.filter(
      (file) => !appliedMigrations.includes(file),
    );

    for (const migration of pendingMigrations) {
      console.log(`Applying migration: ${migration}`);
      await this.applyMigration(migration, 'up');
    }

    console.log('Todas as migrações foram aplicadas com sucesso!');
  }

  public async revertLastMigration() {
    const pool = Database.getPool();
    const result = await pool.query(
      `SELECT name FROM "_migrations" ORDER BY id DESC LIMIT 1`,
    );
    const lastMigration = result.rows[0]?.name;

    if (!lastMigration) {
      console.log('Nenhuma migração encontrada para reverter.');
      return;
    }

    console.log(`Revertendo a migração: ${lastMigration}`);
    await this.applyMigration(lastMigration, 'down');
    console.log(`Migração ${lastMigration} revertida com sucesso!`);
  }
}

export default MigrationManager;
