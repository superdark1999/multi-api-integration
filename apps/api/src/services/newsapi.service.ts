import type { NewsData } from '../types/aggregated.js';

const NEWSAPI_BASE = 'https://newsapi.org/v2';

export async function fetchNews(
  apiKey: string,
  keyword?: string
): Promise<NewsData[]> {
  if (!apiKey) {
    console.warn('[NewsAPI] API key not set');
    return [];
  }
  try {
    const url = keyword
      ? `${NEWSAPI_BASE}/everything?q=${encodeURIComponent(keyword)}&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`
      : `${NEWSAPI_BASE}/top-headlines?country=us&pageSize=5&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsAPI error: ${res.status}`);
    const data = (await res.json()) as {
      articles?: Array<{
        title?: string;
        source?: { name?: string };
        url?: string;
      }>;
    };
    const articles = data.articles ?? [];
    return articles
      .filter((a) => a.title)
      .map((a) => ({
        title: a.title!,
        source: a.source?.name ?? 'Unknown',
        url: a.url ?? '',
      }));
  } catch (err) {
    console.error('[NewsAPI]', err);
    return [];
  }
}
