import { createContext, useContext, useState, type ReactNode } from 'react';

interface PricingState {
  markupPercent: number;
  setMarkupPercent: (v: number) => void;
}

const PricingContext = createContext<PricingState | null>(null);

export function PricingProvider({ children }: { children: ReactNode }) {
  const [markupPercent, setMarkupPercent] = useState<number>(() => {
    const stored = localStorage.getItem('skyframe-markup');
    return stored ? parseFloat(stored) : 0.28;
  });

  function update(v: number) {
    localStorage.setItem('skyframe-markup', String(v));
    setMarkupPercent(v);
  }

  return (
    <PricingContext.Provider value={{ markupPercent, setMarkupPercent: update }}>
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing(): PricingState {
  const ctx = useContext(PricingContext);
  if (!ctx) throw new Error('usePricing must be inside PricingProvider');
  return ctx;
}
