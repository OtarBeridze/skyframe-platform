import { useMemo } from 'react';
import { calculatePrice, type PricingInputs, type PriceBreakdown } from '../lib/pricing';

export function usePrice(inputs: PricingInputs): PriceBreakdown {
  // Use individual primitive values as deps — inputs object may be re-created
  // each render via spread (e.g. { ...state, markupPercent }), so object
  // identity is not a stable signal. Object.values gives value-based comparison.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => calculatePrice(inputs), Object.values(inputs));
}
