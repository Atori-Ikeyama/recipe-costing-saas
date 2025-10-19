import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient:
    | ReturnType<typeof postgres>
    | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb:
    | ReturnType<typeof drizzle<typeof schema>>
    | undefined;
}

const client =
  globalThis.__postgresClient ??
  postgres(process.env.POSTGRES_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

const dbInstance =
  globalThis.__drizzleDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__postgresClient = client;
  globalThis.__drizzleDb = dbInstance;
}

export { client, dbInstance as db };
