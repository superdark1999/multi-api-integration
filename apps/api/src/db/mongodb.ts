import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

const COLLECTION = 'aggregated_data';

export async function connectMongo(uri: string): Promise<Db> {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export async function saveAggregatedData(data: object): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  if (!db) {
    await connectMongo(uri);
  }
  if (!db) return;
  await db.collection(COLLECTION).insertOne({
    ...data,
    storedAt: new Date().toISOString(),
  });
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function isConnected(): boolean {
  return db !== null;
}
