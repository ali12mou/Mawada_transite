import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../lib/apiBase';

type CurrencyCode = 'USD' | 'FDJ';

interface CurrencyContextType {
  currencyCode: CurrencyCode;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatAmount: (amount: number | string | null | undefined, code?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'geosom-currency';

function normalizeCurrencyCode(value: string | null | undefined): CurrencyCode {
  if (!value) return 'USD';
  const normalized = value.toUpperCase();
  if (normalized === 'FDJ' || normalized === 'DJF') return 'FDJ';
  if (normalized === 'USD' || normalized === '$') return 'USD';
  return 'USD';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return normalizeCurrencyCode(stored);
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/api/transit/config/currency-symbol`);
        if (!r.ok) return;
        const j = (await r.json()) as { data?: string | null };
        if (j.data) {
          setCurrencyCodeState(normalizeCurrencyCode(j.data));
        }
      } catch {
        /* ignore — fallback localStorage */
      }
    };
    loadCurrency();
  }, []);

  const setCurrencyCode = (code: CurrencyCode) => {
    setCurrencyCodeState(code);
  };

  const value = useMemo<CurrencyContextType>(() => {
    const formatAmount = (amount: number | string | null | undefined, code?: CurrencyCode) => {
      const parsedAmount = Number(amount ?? 0);
      const resolvedCode = code || currencyCode;
      return `${resolvedCode} ${parsedAmount.toFixed(2)}`;
    };

    return {
      currencyCode,
      setCurrencyCode,
      formatAmount,
    };
  }, [currencyCode]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}


