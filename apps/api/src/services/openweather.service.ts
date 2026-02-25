import type { WeatherData } from '../types/aggregated.js';

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export async function fetchWeatherData(
  city: string,
  apiKey: string
): Promise<WeatherData | null> {
  if (!apiKey) {
    console.warn('[OpenWeather] API key not set');
    return null;
  }
  try {
    const res = await fetch(
      `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    if (!res.ok) throw new Error(`OpenWeather API error: ${res.status}`);
    const data = (await res.json()) as {
      name?: string;
      main?: { temp?: number };
      weather?: Array<{ main?: string }>;
    };
    return {
      city: data.name ?? city,
      temperature: Math.round(data.main?.temp ?? 0),
      condition: data.weather?.[0]?.main ?? 'Unknown',
    };
  } catch (err) {
    console.error('[OpenWeather]', err);
    return null;
  }
}
