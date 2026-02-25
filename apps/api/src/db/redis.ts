import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  return client;
}

export async function connectRedis(url: string): Promise<Redis> {
  if (client) return client;
  client = new Redis(url, { maxRetriesPerRequest: 3 });
  client.on('error', (err) => console.warn('[Redis]', err.message));
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
