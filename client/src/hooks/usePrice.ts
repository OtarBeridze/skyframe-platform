import { useMemo } from 'react';
import { calculatePrice, type PricingInputs, type PriceBreakdown } from '../lib/pricing';

export function usePrice(inputs: PricingInputs): PriceBreakdown {
  return useMemo(() => calculatePrice(inputs), [inputs]);
}
