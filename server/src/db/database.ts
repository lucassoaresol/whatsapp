import pkg from 'pg';

import { env } from '../config/env';

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
}

export default Database;
