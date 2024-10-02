import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  dbHost: z.string().ip(),
  dbPort: z
    .string()
    .default('5432')
    .transform((val) => parseInt(val, 10)),
  dbUser: z.string(),
  dbPassword: z.string(),
  dbName: z.string(),
  port: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
});

export const env = schema.parse({
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  port: process.env.PORT,
});
