import type { AggregatedData, WeatherData } from '../types/aggregated.js';
import { fetchCryptoData } from './coingecko.service.js';
import { fetchWeatherData } from './openweather.service.js';
import { fetchNews } from './newsapi.service.js';
import { saveAggregatedData } from '../db/mongodb.js';

const DEFAULT_WEATHER: WeatherData = {
  city: 'New York',
  temperature: 0,
  condition: 'Unknown',
};

export interface AggregationParams {
  city?: string;
  newsKeyword?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function fetchAndAggregateData(
  params?: AggregationParams
): Promise<AggregatedData> {
  const city = params?.city ?? 'New York';
  const openWeatherKey = process.env.OPENWEATHER_API_KEY ?? '';
  const newsApiKey = process.env.NEWSAPI_KEY ?? '';

  const [crypto, weather, news] = await Promise.all([
    fetchCryptoData(params?.minPrice, params?.maxPrice),
    fetchWeatherData(city, openWeatherKey),
    fetchNews(newsApiKey, params?.newsKeyword),
  ]);

  const aggregated: AggregatedData = {
    crypto: crypto.length > 0 ? crypto : [],
    weather: weather ?? DEFAULT_WEATHER,
    latest_news: news.length > 0 ? news : [],
    fetchedAt: new Date().toISOString(),
  };

  if (process.env.MONGODB_URI) {
    try {
      await saveAggregatedData(aggregated);
    } catch (err) {
      console.error('[DB] Failed to save aggregated data:', err);
    }
  }

  return aggregated;
}
