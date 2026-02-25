import { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorMessage } from '@org/shop-shared-ui';
import './aggregated-dashboard.css';

const API_BASE = '/api';

interface CryptoData {
  name: string;
  symbol: string;
  price: number;
  market_cap: number;
}

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
}

interface NewsData {
  title: string;
  source: string;
  url: string;
}

interface AggregatedData {
  crypto: CryptoData[];
  weather: WeatherData;
  latest_news: NewsData[];
  fetchedAt: string;
}

const CITIES = [
  'New York',
  'London',
  'Tokyo',
  'Paris',
  'Sydney',
  'Berlin',
  'Toronto',
  'Singapore',
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return formatPrice(cap);
}

export function AggregatedDashboard() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [city, setCity] = useState('New York');
  const [newsKeyword, setNewsKeyword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (newsKeyword.trim()) params.set('newsKeyword', newsKeyword.trim());
      const min = minPrice ? parseFloat(minPrice) : undefined;
      const max = maxPrice ? parseFloat(maxPrice) : undefined;
      if (min !== undefined && !isNaN(min)) params.set('minPrice', String(min));
      if (max !== undefined && !isNaN(max)) params.set('maxPrice', String(max));

      const res = await fetch(`${API_BASE}/aggregated-data?${params}`);
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        if (res.status === 429) {
          const msg =
            (json as { error?: string })?.error ??
            'Too many requests. Please wait a minute before trying again.';
          throw new Error(msg);
        }
        const err = json as { error?: string; message?: string };
        throw new Error(err?.error ?? err?.message ?? `Failed to fetch: ${res.status}`);
      }

      setData(json as AggregatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyFilters = () => {
    fetchData();
  };

  return (
    <div className="aggregated-dashboard">
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Crypto price range</label>
          <div className="filter-row">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>—</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-group">
          <label>Weather city</label>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>News search</label>
          <input
            type="text"
            placeholder="Search news by keyword..."
            value={newsKeyword}
            onChange={(e) => setNewsKeyword(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={handleApplyFilters} disabled={loading}>
          {loading ? 'Loading...' : 'Apply & Refresh'}
        </button>
      </div>

      {loading && !data && (
        <div className="dashboard-loading">
          <LoadingSpinner />
        </div>
      )}

      {error && !data && (
        <ErrorMessage message={error} onRetry={fetchData} />
      )}

      {data && !loading && (
        <div className="dashboard-content">
          <section className="crypto-section">
            <h2>Crypto</h2>
            <div className="cards-grid">
              {data.crypto.length === 0 ? (
                <div className="card empty-card">
                  No crypto in selected price range
                </div>
              ) : (
                data.crypto.map((c) => (
                  <div key={c.symbol} className="card crypto-card">
                    <div className="card-header">
                      <span className="crypto-name">{c.name}</span>
                      <span className="crypto-symbol">{c.symbol}</span>
                    </div>
                    <div className="card-body">
                      <div className="crypto-price">{formatPrice(c.price)}</div>
                      <div className="crypto-cap">
                        MCap: {formatMarketCap(c.market_cap)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="weather-section">
            <h2>Weather</h2>
            <div className="cards-grid">
              <div className="card weather-card">
                <div className="card-header">
                  <span className="weather-city">{data.weather.city}</span>
                </div>
                <div className="card-body">
                  <div className="weather-temp">{data.weather.temperature}°C</div>
                  <div className="weather-condition">{data.weather.condition}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="news-section">
            <h2>News</h2>
            <div className="cards-grid">
              {data.latest_news.length === 0 ? (
                <div className="card empty-card">
                  No news found
                </div>
              ) : (
                data.latest_news.map((n, i) => (
                  <a
                    key={i}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card news-card"
                  >
                    <div className="card-body">
                      <div className="news-title">{n.title}</div>
                      <div className="news-source">{n.source}</div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </section>

          <p className="fetched-at">
            Last updated: {new Date(data.fetchedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default AggregatedDashboard;
