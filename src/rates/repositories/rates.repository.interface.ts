import { MonobankRate } from '../interfaces';

export interface RatesRepository {
  fetchRates(): Promise<MonobankRate[]>;
}

export const RATES_REPOSITORY = Symbol('RATES_REPOSITORY');
