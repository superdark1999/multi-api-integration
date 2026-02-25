import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../db/redis.js';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;
const KEY_PREFIX = 'ratelimit:';

const memoryStore = new Map<string, number[]>();

function getClientId(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function pruneOld(timestamps: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

function checkMemoryLimit(clientId: string): boolean {
  let timestamps = memoryStore.get(clientId) ?? [];
  timestamps = pruneOld(timestamps);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(Date.now());
  memoryStore.set(clientId, timestamps);
  return false;
}

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const clientId = getClientId(req);
  const redis = getRedisClient();

  if (redis) {
    const key = `${KEY_PREFIX}${clientId}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    try {
      await redis.zremrangebyscore(key, 0, windowStart);
      const count = await redis.zcard(key);
      console.log('🚀 ~ rateLimitMiddleware ~ count:', count);

      if (count >= MAX_REQUESTS) {
        res.status(429).json({
          error: 'Too many requests, please wait before retrying.',
        });
        return;
      }

      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(WINDOW_MS / 1000) + 1);
    } catch (err) {
      console.error('[RateLimit] Redis error, falling back to memory:', err);
      if (checkMemoryLimit(clientId)) {
        res.status(429).json({
          error: 'Too many requests, please wait before retrying.',
        });
        return;
      }
      next();
      return;
    }
  } else {
    if (checkMemoryLimit(clientId)) {
      res.status(429).json({
        error: 'Too many requests, please wait before retrying.',
      });
      return;
    }
  }

  next();
}
