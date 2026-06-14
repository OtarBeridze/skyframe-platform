import { describe, it, expect } from 'vitest';
import { calculatePrice, DEFAULT_INPUTS, type PricingInputs } from './pricing';
import { getSizeKey } from './pricingTables';

// ── getSizeKey ───────────────────────────────────────────────────────────────

describe('getSizeKey', () => {
  it('returns the exact bucket when dimensions match exactly', () => {
    expect(getSizeKey(16, 20)).toBe('16x20');
  });

  it('normalizes landscape to portrait (swaps w/h)', () => {
    expect(getSizeKey(20, 16)).toBe('16x20');
  });

  it('returns the next-larger bucket for fractional sizes', () => {
    // 17×21: 17≤18 and 21≤24 → lands in 18x24
    expect(getSizeKey(17, 21)).toBe('18x24');
    // 19×25: 19≤20 and 25≤30 → lands in 20x30
    expect(getSizeKey(19, 25)).toBe('20x30');
  });

  it('returns null for sizes larger than any bucket', () => {
    expect(getSizeKey(200, 200)).toBeNull();
  });

  it('returns 8x10 for very small sizes', () => {
    expect(getSizeKey(4, 5)).toBe('8x10');
  });
});

// ── Printing ─────────────────────────────────────────────────────────────────

describe('calculatePrice — printing', () => {
  const base: PricingInputs = {
    ...DEFAULT_INPUTS,
    frameInRate: 0, floaterStd: 0, floaterOvr: 0,
    matType: '', matConfig: '', glazingType: '', mountingType: '',
    markupPercent: 0,
  };

  it('is $0 when paperType is empty', () => {
    const r = calculatePrice({ ...base, paperType: '', printW: 16, printH: 20 });
    expect(r.printing).toBe(0);
  });

  it('is $0 when print dimensions are 0', () => {
    const r = calculatePrice({ ...base, paperType: 'ENHANCED MATTE', printW: 0, printH: 0 });
    expect(r.printing).toBe(0);
  });

  it('returns STANDARD price for Enhanced Matte 16×20 single', () => {
    const r = calculatePrice({ ...base, paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'single' });
    expect(r.printing).toBe(46);
  });

  it('returns STANDARD multiple price for 16×20', () => {
    const r = calculatePrice({ ...base, paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'multiple' });
    expect(r.printing).toBe(32);
  });

  it('returns FINE ART price for Hahnemuhle', () => {
    const r = calculatePrice({ ...base, paperType: 'HAHNEMUHLE', printW: 16, printH: 20, multiplePrints: 'single' });
    expect(r.printing).toBe(90);
  });

  it('returns GALLERY FINE ART price for Canvas', () => {
    const r = calculatePrice({ ...base, paperType: 'CANVAS', printW: 16, printH: 20, multiplePrints: 'single' });
    expect(r.printing).toBe(124);
  });
});

// ── Frame ────────────────────────────────────────────────────────────────────

describe('calculatePrice — frame', () => {
  const base: PricingInputs = {
    ...DEFAULT_INPUTS,
    paperType: '', matType: '', matConfig: '', glazingType: '', mountingType: '',
    markupPercent: 0,
  };

  it('is $0 when frameInRate is 0', () => {
    const r = calculatePrice({ ...base, frameInRate: 0, mouldingWidth: 0, dimMode: 'OD', frameW: 32, frameH: 42 });
    expect(r.frame).toBe(0);
  });

  it('calculates frame cost correctly for OD mode', () => {
    // OD 32×42, moulding 2in → id 28×38; totalInches = (32+42)*2 = 148
    // frame = 148 * 1.1 * 1 + 0 = 162.8
    const r = calculatePrice({
      ...base,
      dimMode: 'OD', frameW: 32, frameH: 42,
      frameInRate: 1.1, mouldingWidth: 2,
      finishMult: 1, finishFixed: 0,
    });
    expect(r.frame).toBeCloseTo(162.8, 2);
  });

  it('adds $100 for splined corners', () => {
    const r1 = calculatePrice({ ...base, dimMode: 'OD', frameW: 32, frameH: 42, frameInRate: 1.1, mouldingWidth: 2, finishMult: 1, finishFixed: 0, splinedCorners: false });
    const r2 = calculatePrice({ ...base, dimMode: 'OD', frameW: 32, frameH: 42, frameInRate: 1.1, mouldingWidth: 2, finishMult: 1, finishFixed: 0, splinedCorners: true });
    expect(r2.frame - r1.frame).toBe(100);
  });

  it('applies finish multiplier', () => {
    const r1 = calculatePrice({ ...base, dimMode: 'OD', frameW: 32, frameH: 42, frameInRate: 1.1, mouldingWidth: 2, finishMult: 1, finishFixed: 0 });
    const r2 = calculatePrice({ ...base, dimMode: 'OD', frameW: 32, frameH: 42, frameInRate: 1.1, mouldingWidth: 2, finishMult: 2, finishFixed: 0 });
    expect(r2.frame).toBeCloseTo(r1.frame * 2, 2);
  });
});

// ── ID/OD conversion ─────────────────────────────────────────────────────────

describe('calculatePrice — ID/OD conversion', () => {
  const base: PricingInputs = {
    ...DEFAULT_INPUTS,
    paperType: '', matType: '', matConfig: '', glazingType: '', mountingType: '',
    markupPercent: 0, frameInRate: 0, floaterStd: 0,
  };

  it('OD mode: totalInches = (OD_W + OD_H) * 2', () => {
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 30, frameH: 40, mouldingWidth: 2 });
    expect(r.totalInches).toBe(140);
  });

  it('ID mode: totalInches uses OD = ID + 2*moulding', () => {
    const r = calculatePrice({ ...base, dimMode: 'ID', frameW: 28, frameH: 38, mouldingWidth: 2 });
    // odW=32, odH=42 → totalInches=148
    expect(r.totalInches).toBe(148);
  });

  it('clamps to 0 when OD < 2*mouldingWidth', () => {
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 2, frameH: 2, mouldingWidth: 4 });
    expect(r.totalInches).toBe(0);
    expect(r.totalSqFt).toBe(0);
  });
});

// ── Markup ───────────────────────────────────────────────────────────────────

describe('calculatePrice — markup', () => {
  it('markup applies to printing + components together', () => {
    const inputs: PricingInputs = {
      ...DEFAULT_INPUTS,
      paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'single',
      matType: '', matConfig: '', glazingType: '', mountingType: '',
      frameInRate: 0, floaterStd: 0,
      discountPercent: 0, discountDollar: 0,
      markupPercent: 0.28,
    };
    const r = calculatePrice(inputs);
    // printing=46, components=0 → markup = 46*0.28 = 12.88
    expect(r.componentsMarkup).toBeCloseTo(0, 2);         // no components
    expect(r.printingWithMarkup).toBeCloseTo(46 * 1.28, 2);
  });
});

// ── Oversize surcharge ────────────────────────────────────────────────────────

describe('calculatePrice — oversize surcharge', () => {
  const base: PricingInputs = {
    ...DEFAULT_INPUTS,
    paperType: '', matType: '', matConfig: '', glazingType: '', mountingType: '',
    frameInRate: 0, floaterStd: 0, markupPercent: 0,
  };

  it('$400 for totalInches 218–335', () => {
    // OD 56×56 → totalInches = 224
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 56, frameH: 56, mouldingWidth: 0 });
    expect(r.oversize).toBe(400);
  });

  it('$1800 for totalInches 336–431', () => {
    // OD 85×85 → totalInches = 340
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 85, frameH: 85, mouldingWidth: 0 });
    expect(r.oversize).toBe(1800);
  });

  it('$4800 for totalInches 432+', () => {
    // OD 110×110 → totalInches = 440
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 110, frameH: 110, mouldingWidth: 0 });
    expect(r.oversize).toBe(4800);
  });

  it('$0 for normal size', () => {
    const r = calculatePrice({ ...base, dimMode: 'OD', frameW: 32, frameH: 42, mouldingWidth: 0 });
    expect(r.oversize).toBe(0);
  });
});

// ── Discount ─────────────────────────────────────────────────────────────────

describe('calculatePrice — discount', () => {
  it('percent discount reduces subtotal correctly', () => {
    const inputs: PricingInputs = {
      ...DEFAULT_INPUTS,
      matType: '', matConfig: '', glazingType: '', mountingType: '',
      frameInRate: 0, floaterStd: 0, markupPercent: 0,
      paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'single',
      discountPercent: 10, discountDollar: 0,
    };
    const r = calculatePrice(inputs);
    expect(r.discount).toBeCloseTo(r.subtotal * 0.1, 2);
  });

  it('fixed dollar discount applied on top of percent', () => {
    const inputs: PricingInputs = {
      ...DEFAULT_INPUTS,
      matType: '', matConfig: '', glazingType: '', mountingType: '',
      frameInRate: 0, floaterStd: 0, markupPercent: 0,
      paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'single',
      discountPercent: 0, discountDollar: 20,
    };
    const r = calculatePrice(inputs);
    expect(r.discount).toBe(20);
  });
});

// ── Tax ──────────────────────────────────────────────────────────────────────

describe('calculatePrice — tax', () => {
  it('applies 8.875% NY tax on afterDiscount amount', () => {
    const inputs: PricingInputs = {
      ...DEFAULT_INPUTS,
      matType: '', matConfig: '', glazingType: '', mountingType: '',
      frameInRate: 0, floaterStd: 0, markupPercent: 0,
      paperType: 'ENHANCED MATTE', printW: 16, printH: 20, multiplePrints: 'single',
      discountPercent: 0, discountDollar: 0,
    };
    const r = calculatePrice(inputs);
    expect(r.tax).toBeCloseTo(r.afterDiscount * 0.08875, 5);
    expect(r.total).toBeCloseTo(r.afterDiscount + r.tax, 5);
  });
});
