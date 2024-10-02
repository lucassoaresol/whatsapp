import pkg from 'pg';

import { env } from '../config/env';
import { IDataDict } from '../interfaces/dataDict';

const { Pool } = pkg;

type PoolType = InstanceType<typeof Pool>;

class Database {
  private static pool: PoolType;

  public static connectPool() {
    if (!Database.pool) {
      Database.pool = new Pool({
        user: env.dbUser,
        host: env.dbHost,
        database: env.dbName,
        password: env.dbPassword,
        port: env.dbPort,
      });
      console.log('Pool de conexões criado.');
    }
  }

  public static getPool(): PoolType {
    if (!Database.pool) {
      throw new Error('Pool não inicializado. Chame connectPool() primeiro.');
    }
    return Database.pool;
  }

  public static async insertIntoTable(
    tableName: string,
    dataDict: IDataDict,
    returningColumn = 'id',
  ): Promise<number | string> {
    const columns = Object.keys(dataDict);
    const values = columns.map((col) => dataDict[col]);

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING ${returningColumn};
      `;

    const result = await this.pool.query(query, values);

    return result.rows[0][returningColumn];
  }

  public static async updateIntoTable(
    tableName: string,
    dataDict: IDataDict,
  ): Promise<void> {
    const columns = Object.keys(dataDict).filter((key) => key !== 'id');
    const values = columns.map((col) => dataDict[col]);

    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

    const query = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE id = $${columns.length + 1};
  `;

    await this.pool.query(query, [...values, dataDict.id]);
  }
}

export default Database;
