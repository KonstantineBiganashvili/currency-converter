# Currency Converter API

A NestJS application that converts currencies using exchange rates from the Monobank API with Redis caching.

## Quick Start

### Option 1: Local Development (Redis required)

1. Start Redis using the included compose file:
```bash
docker compose -f docker-compose-redis.yml up -d
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Install dependencies and run:
```bash
npm install
npm run start:dev
```

### Option 2: Full Docker Setup

Run both the app and Redis with Docker Compose:
```bash
docker compose -f docker-compose-dev.yaml up -d
```

## API Access

- **Base URL:** `http://localhost:3000/api/v1`
- **Swagger Docs:** `http://localhost:3000/api/v1/docs`
- **Health Check:** `GET /api/v1/health`

## Convert Currency

**Endpoint:** `POST /api/v1/currency/convert`

```bash
curl -X POST http://localhost:3000/api/v1/currency/convert \
  -H "Content-Type: application/json" \
  -d '{"sourceCurrency": "USD", "targetCurrency": "UAH", "amount": 100}'
```

**Response:**
```json
{
  "sourceCurrency": "USD",
  "targetCurrency": "UAH",
  "amount": 100,
  "convertedAmount": 4150.00,
  "rate": 41.5,
  "rateDate": "2024-01-15T12:00:00.000Z"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Application port |
| `MONOBANK_API_URL` | `https://api.monobank.ua/bank/currency` | Monobank API endpoint |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `CACHE_TTL` | `300` | Cache TTL in seconds |

## Testing

```bash
npm test          # Run unit tests
npm run test:cov  # Run with coverage
```

## Architecture

- **Repository Pattern** - Monobank API abstraction
- **Cache-Aside Pattern** - Redis caching with configurable TTL
- **Circuit Breaker** - Prevents cascading failures (opens after 5 failures)
- **Rate Limiting** - 100 requests/minute per IP
- **Global Exception Filter** - Consistent error responses

## Tech Stack

- NestJS 11 / TypeScript
- Redis (via @keyv/redis)
- Swagger/OpenAPI
- Winston logging
- Jest for testing
