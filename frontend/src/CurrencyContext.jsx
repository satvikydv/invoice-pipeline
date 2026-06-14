import React, { createContext, useState, useContext, useEffect } from 'react';

export const CurrencyContext = createContext();

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem('invoice_iq_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('invoice_iq_currency', currencyCode);
  }, [currencyCode]);

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const formatAmount = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencyCode, setCurrencyCode, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
