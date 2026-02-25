export interface CryptoData {
  name: string;
  symbol: string;
  price: number;
  market_cap: number;
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
}

export interface NewsData {
  title: string;
  source: string;
  url: string;
}

export interface AggregatedData {
  crypto: CryptoData[];
  weather: WeatherData;
  latest_news: NewsData[];
  fetchedAt: string;
}
