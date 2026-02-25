import 'dotenv/config';
import express from 'express';
import { connectMongo, disconnectMongo, isConnected } from './db/mongodb.js';
import { connectRedis, disconnectRedis } from './db/redis.js';
import { fetchAndAggregateData } from './services/aggregation.service.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

const app = express();

app.use(express.json());
app.use(rateLimitMiddleware);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.send({ message: 'Multi-API Integration API' });
});

app.get('/aggregated-data', async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const newsKeyword = req.query.newsKeyword as string | undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const data = await fetchAndAggregateData({
      city,
      newsKeyword,
      minPrice,
      maxPrice,
    });
    res.json(data);
  } catch (error) {
    console.error('[aggregated-data]', error);
    res.status(500).json({
      error: 'Failed to fetch aggregated data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isConnected() ? 'connected' : 'disconnected',
  });
});

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  connectMongo(mongoUri).catch((err) => {
    console.warn('[MongoDB] Connection failed, data will not be persisted:', err.message);
  });
}

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  connectRedis(redisUrl).catch((err) => {
    console.warn('[Redis] Connection failed, rate limiting disabled:', err.message);
  });
}

const server = app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

process.on('SIGTERM', async () => {
  await disconnectMongo();
  await disconnectRedis();
  server.close();
});
