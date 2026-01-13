import { Environment } from './env.validation';

export interface AppConfig {
  nodeEnv: Environment;
  port: number;
}

export interface MonobankConfig {
  apiUrl: string;
}

export interface CacheConfig {
  ttl: number;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface Config {
  app: AppConfig;
  monobank: MonobankConfig;
  cache: CacheConfig;
  redis: RedisConfig;
}

export default (): Config => ({
  app: {
    nodeEnv: (process.env.NODE_ENV as Environment) || Environment.Development,
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
  monobank: {
    apiUrl: process.env.MONOBANK_API_URL ?? 'https://api.monobank.ua/bank/currency',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL ?? '300', 10),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
});
