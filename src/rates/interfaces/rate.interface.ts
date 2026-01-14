export interface MonobankRate {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

export interface ExchangeRate {
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  date: Date;
}
