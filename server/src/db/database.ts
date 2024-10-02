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
    referenceColumn = 'id',
  ): Promise<void> {
    const columns = Object.keys(dataDict).filter((key) => key !== referenceColumn);
    const values = columns.map((col) => dataDict[col]);

    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

    const query = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE ${referenceColumn} = $${columns.length + 1};
  `;

    await this.pool.query(query, [...values, dataDict[referenceColumn]]);
  }

  public static async searchAll<T>(
    table: string,
    fields: string[] | null = null,
  ): Promise<T[]> {
    let query: string;

    if (fields && fields.length > 0) {
      if (fields.length === 1) {
        query = `
          SELECT ${fields[0]}
          FROM ${table};
        `;
      } else {
        const selectedFields = fields.join(', ');
        query = `
          SELECT ${selectedFields}
          FROM ${table};
        `;
      }
    } else {
      query = `
        SELECT *
        FROM ${table};
      `;
    }

    const result = await this.pool.query(query);
    return result.rows as T[];
  }

  public static async searchUniqueByField<T>(
    table: string,
    field: string,
    value: any,
    fields: string[] | null = null,
  ): Promise<T | null> {
    let query: string;

    if (fields && fields.length > 0) {
      if (fields.length === 1) {
        query = `
          SELECT ${fields[0]}
          FROM ${table}
          WHERE ${field} = $1
          LIMIT 1;
        `;
      } else {
        const selectedFields = fields.join(', ');
        query = `
          SELECT ${selectedFields}
          FROM ${table}
          WHERE ${field} = $1
          LIMIT 1;
        `;
      }
    } else {
      query = `
        SELECT *
        FROM ${table}
        WHERE ${field} = $1
        LIMIT 1;
      `;
    }

    const result = await this.pool.query(query, [value]);

    if (result.rows.length > 0) {
      return result.rows[0] as T;
    } else {
      return null;
    }
  }

  public static async deleteFromTable(
    tableName: string,
    id: number | string,
    idColumn: string = 'id',
  ): Promise<void> {
    const query = `
      DELETE FROM ${tableName}
      WHERE ${idColumn} = $1;
    `;

    await this.pool.query(query, [id]);
  }
}

export default Database;
