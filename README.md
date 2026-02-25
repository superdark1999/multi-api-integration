# Multi-API Integration

A full-stack application that aggregates data from multiple public APIs (CoinGecko, OpenWeather, NewsAPI) into a unified dashboard with filtering, rate limiting, and optional database persistence.

## Features

- **Backend API** – Fetches and normalizes data from CoinGecko (crypto), OpenWeather (weather), and NewsAPI (news)
- **Aggregated endpoint** – Single `/aggregated-data` response combining all sources
- **Filtering** – Crypto price range, weather by city, news by keyword
- **Rate limiting** – 5 requests/minute per client via Redis (in-memory fallback when Redis is unavailable)
- **Dashboard UI** – Card-based layout with Crypto, Weather, and News sections

## Prerequisites

- **Node.js** 18+ and npm (or pnpm)
- **Redis** (for rate limiting) – [Install Redis](https://redis.io/docs/install/) or run via Docker:
  ```bash
  docker run -d -p 6379:6379 redis:alpine
  ```
- **MongoDB** (optional, for persisting aggregated data)
- **API keys** – OpenWeather and NewsAPI (CoinGecko is free, no key required)

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd multi-api-integration

npm install
```

### 2. Configure environment

Copy the API env example and add your keys:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENWEATHER_API_KEY` | Yes (for weather) | Get from [OpenWeather](https://openweathermap.org/api) |
| `NEWSAPI_KEY` | Yes (for news) | Get from [NewsAPI](https://newsapi.org/register) |
| `REDIS_URL` | Yes (for rate limiting) | `redis://localhost:6379` |
| `MONGODB_URI` | No | `mongodb://localhost:27017/multi-api` for persistence |
| `PORT` | No | API port (default: 3333) |

### 3. Start Redis (if not already running)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or start your local Redis server
redis-server
```

## Running the application

### Option A: Run both API and Shop together

The shop app depends on the API and will start it automatically:

```bash
npm run shop
```

- **Shop UI**: http://localhost:4200  
- **API**: http://localhost:3333 (started by shop)

### Option B: Run API and Shop separately

**Terminal 1 – API:**

```bash
npm run api
```

API runs at http://localhost:3333

**Terminal 2 – Shop:**

```bash
npm run shop
```

Shop runs at http://localhost:4200 and proxies `/api` requests to the backend.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/aggregated-data` | Aggregated crypto, weather, news |
| GET | `/health` | Status (API + DB) |

### Query parameters for `/aggregated-data`

| Param | Description |
|-------|-------------|
| `city` | Weather city (e.g. London, Tokyo) |
| `newsKeyword` | Search news by keyword |
| `minPrice` | Filter crypto by minimum price (USD) |
| `maxPrice` | Filter crypto by maximum price (USD) |

### Example

```bash
curl "http://localhost:3333/aggregated-data?city=London&newsKeyword=tech"
```

## Project structure

```
multi-api-integration/
├── apps/
│   ├── api/                 # Express backend
│   │   ├── src/
│   │   │   ├── main.ts      # Entry, routes
│   │   │   ├── db/          # MongoDB, Redis
│   │   │   ├── middleware/  # Rate limiting
│   │   │   ├── services/   # CoinGecko, OpenWeather, NewsAPI
│   │   │   └── types/
│   │   └── .env.example
│   └── shop/                # React dashboard
│       └── src/app/
│           └── aggregated-dashboard.tsx
├── libs/
│   └── shop/shared-ui/      # LoadingSpinner, ErrorMessage
├── package.json
└── README.md
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run api` | `nx run api:serve` | Start API server |
| `npm run shop` | `nx run shop:serve` | Start shop (starts API too) |

## Rate limiting

- **Limit**: 5 requests per minute per client (by IP)
- **Response** (429): `{ "error": "Too many requests, please wait before retrying." }`
- **Storage**: Redis (falls back to in-memory if Redis is unavailable)

## Troubleshooting

- **Port 3333 in use**: Kill the process or set `PORT=3334` in `.env`
- **Weather/News empty**: Ensure `OPENWEATHER_API_KEY` and `NEWSAPI_KEY` are set
- **429 errors**: Wait 1 minute or ensure Redis is running for accurate limits
