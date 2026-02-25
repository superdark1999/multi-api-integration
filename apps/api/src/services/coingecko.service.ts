import type { CryptoData } from '../types/aggregated.js';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const CRYPTO_IDS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin'];
const CRYPTO_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  cardano: 'Cardano',
  dogecoin: 'Dogecoin',
};
const CRYPTO_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  cardano: 'ADA',
  dogecoin: 'DOGE',
};

export async function fetchCryptoData(
  minPrice?: number,
  maxPrice?: number
): Promise<CryptoData[]> {
  try {
    const ids = CRYPTO_IDS.join(',');
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true`
    );
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
    const data = (await res.json()) as Record<
      string,
      { usd?: number; usd_market_cap?: number }
    >;
    const result: CryptoData[] = [];
    for (const [id, values] of Object.entries(data)) {
      if (!values?.usd) continue;
      const price = values.usd;
      if (minPrice !== undefined && price < minPrice) continue;
      if (maxPrice !== undefined && price > maxPrice) continue;
      result.push({
        name: CRYPTO_NAMES[id] ?? id,
        symbol: CRYPTO_SYMBOLS[id] ?? id.toUpperCase(),
        price,
        market_cap: values.usd_market_cap ?? 0,
      });
    }
    return result.sort((a, b) => b.market_cap - a.market_cap);
  } catch (err) {
    console.error('[CoinGecko]', err);
    return [];
  }
}
