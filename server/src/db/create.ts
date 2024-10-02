import pkg from 'pg';

import { env } from '../config/env';

const { Client } = pkg;

const client = new Client({
  user: env.dbUser,
  host: env.dbHost,
  password: env.dbPassword,
  port: env.dbPort,
  database: 'postgres',
});

async function createDatabase() {
  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${env.dbName}"`);
    console.log(`Banco de dados "${env.dbName}" criado com sucesso!`);
  } catch (err: any) {
    if (err.code === '42P04') {
      console.log(`Banco de dados "${env.dbName}" já existe.`);
    } else {
      console.error('Erro ao criar o banco de dados:', err);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
