import type { CurrencyCode, ExchangeRateSettings } from "@/lib/pos-shared";

export function exchangeRateFor(currency: CurrencyCode, rates: ExchangeRateSettings) {
  return currency === "MXN" ? 1 : rates[currency];
}

export function convertToMxn(amount: number, currency: CurrencyCode, rates: ExchangeRateSettings) {
  return amount * exchangeRateFor(currency, rates);
}
