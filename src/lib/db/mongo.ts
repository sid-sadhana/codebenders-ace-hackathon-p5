import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getServerEnv } from "@/lib/env";

type MongoCache = { client?: Promise<MongoClient> };

// One client per process: survives dev hot reloads and is reused across
// warm serverless invocations.
const globalForMongo = globalThis as typeof globalThis & {
  __cwyMongo?: MongoCache;
};
const cache: MongoCache = (globalForMongo.__cwyMongo ??= {});

function connect(): Promise<MongoClient> {
  const { MONGODB_URI } = getServerEnv();
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });
  return client.connect().catch((error: unknown) => {
    cache.client = undefined;
    throw error;
  });
}

export async function getDb(): Promise<Db> {
  cache.client ??= connect();
  const client = await cache.client;
  return client.db(getServerEnv().MONGODB_DB);
}
