import {
  PAPER_CATEGORY,
  PRINTING_PRICES,
  MATTING_PRICES,
  GLAZING_PRICES_GLASS,
  GLAZING_PRICES_PLEXI,
  MOUNTING_PRICES,
  getSizeKey,
} from './pricingTables';

export interface PricingInputs {
  // Printing
  paperType: string;         // '' = no printing
  multiplePrints: 'single' | 'multiple';
  printW: number;
  printH: number;

  // Frame dimensions
  frameW: number;
  frameH: number;
  dimMode: 'OD' | 'ID';

  // Moulding — value from select: "pricePerIn|mouldingWidthIn", e.g. "1.1|2"
  frameInRate: number;       // price per linear inch
  mouldingWidth: number;     // moulding depth in inches (for ID/OD conversion)
  finishMult: number;        // finish multiplier (1, 1.5, 2 …)
  finishFixed: number;       // fixed finish surcharge (e.g. 80 for custom lacquer)
  splinedCorners: boolean;

  // Frame out / fillet
  frameOutRate: number;      // price per linear inch, 0 = none

  // Floater frame — value from select: "stdRate|ovrRate"
  floaterStd: number;
  floaterOvr: number;        // oversize rate (used when odW>44 || odH>64)

  // Matting
  matType: string;           // '' = none
  matConfig: string;         // 'BOOKMAT' | 'FLOAT' | 'MAT AND FLOAT'

  // Glazing
  glazingType: string;       // '' = none
  glazingMaterial: 'GLASS' | 'PLEXI';

  // Mounting
  mountingType: string;      // '' = none

  // Hinging
  hingingType: number;       // flat dollar amount, 0 = none

  // Misc
  miscLumpSum: number;
  miscPerInch: number;
  crossbars: boolean;
  spacers: boolean;
  linenSpacer: boolean;
  woodenSpacer: boolean;
  metalZclips: boolean;
  strainers: boolean;
  hwSecurityHangers: boolean;
  hwEasels: boolean;
  hwChloroplast: boolean;

  // Mirror
  mirrorType: number;        // $/sq ft, 0 = none
  bevelSize: number;         // $/in, 0 = none

  // Packaging
  cardboardPack: number;     // flat $
  cratePack: number;         // flat $

  // Discount
  discountPercent: number;
  discountDollar: number;

  // Markup — defaults to 0.28, overridden from Pricing Admin
  markupPercent: number;
}

export interface PriceBreakdown {
  // Raw component costs (pre-markup)
  printing: number;
  frame: number;
  matting: number;
  glazing: number;
  mounting: number;
  misc: number;
  oversize: number;

  // Derived display values matching the Live Quote panel
  printingWithMarkup: number;  // printing + printing*markup (shown on Printing line)
  componentsMarkup: number;    // (frame+mat+glaze+mount+misc) * markup (shown on Markup line)

  subtotal: number;
  discount: number;
  afterDiscount: number;
  tax: number;
  total: number;

  // Computed geometry (used by UI read-only fields)
  totalInches: number;
  totalSqFt: number;
}

export function calculatePrice(inputs: PricingInputs): PriceBreakdown {
  const {
    paperType, multiplePrints, printW, printH,
    frameW, frameH, dimMode,
    frameInRate, mouldingWidth, finishMult, finishFixed, splinedCorners,
    frameOutRate, floaterStd, floaterOvr,
    matType, matConfig,
    glazingType, glazingMaterial,
    mountingType,
    hingingType, miscLumpSum, miscPerInch,
    crossbars, spacers, linenSpacer, woodenSpacer, metalZclips, strainers,
    hwSecurityHangers, hwEasels, hwChloroplast,
    mirrorType, bevelSize,
    cardboardPack, cratePack,
    discountPercent, discountDollar,
    markupPercent,
  } = inputs;

  // ── Printing ────────────────────────────────────────────────────────────────
  let printing = 0;
  if (paperType && printW > 0 && printH > 0) {
    const category = PAPER_CATEGORY[paperType] ?? 'STANDARD';
    const priceSet  = PRINTING_PRICES[category];
    const sizeKey   = getSizeKey(printW, printH);
    const printType = multiplePrints === 'multiple' ? 'Multiple' : 'Standard';
    if (sizeKey && priceSet[printType]?.[sizeKey]) {
      printing = priceSet[printType][sizeKey];
    }
  }

  // ── ID / OD conversion ──────────────────────────────────────────────────────
  let idW: number, idH: number, odW: number, odH: number;
  if (dimMode === 'OD') {
    odW = frameW; odH = frameH;
    idW = frameW - 2 * mouldingWidth;
    idH = frameH - 2 * mouldingWidth;
  } else {
    idW = frameW; idH = frameH;
    odW = frameW + 2 * mouldingWidth;
    odH = frameH + 2 * mouldingWidth;
  }
  if (idW <= 0 || idH <= 0) {
    idW = 0; idH = 0; odW = 0; odH = 0;
  }

  const totalInches  = (odW + odH) * 2;
  const idPerimeter  = (idW + idH) * 2;
  const totalSqFt    = idW > 0 && idH > 0 ? (idW * idH) / 144 : 0;

  // ── Frame ───────────────────────────────────────────────────────────────────
  let frame = 0;
  if (frameInRate > 0 && totalInches > 0) {
    frame += totalInches * frameInRate * finishMult + finishFixed;
    if (splinedCorners) frame += 100;
  }
  if (frameOutRate > 0 && totalInches > 0) {
    frame += totalInches * frameOutRate * finishMult;
  }
  if (floaterStd > 0 && totalInches > 0) {
    const floaterRate = (odW > 44 || odH > 64) ? floaterOvr : floaterStd;
    frame += totalInches * floaterRate;
  }

  // ── Matting ─────────────────────────────────────────────────────────────────
  let matting = 0;
  if (matType && matConfig && idW > 0 && idH > 0) {
    const sizeKey = getSizeKey(idW, idH);
    if (sizeKey && MATTING_PRICES[matType]?.[matConfig]?.[sizeKey]) {
      matting = MATTING_PRICES[matType][matConfig][sizeKey];
    }
  }

  // ── Glazing ─────────────────────────────────────────────────────────────────
  let glazing = 0;
  if (glazingType && idW > 0 && idH > 0) {
    const sizeKey = getSizeKey(idW, idH);
    const sqft = totalSqFt;
    if (sizeKey) {
      if (glazingMaterial === 'GLASS' && GLAZING_PRICES_GLASS[glazingType]?.[sizeKey]) {
        glazing = GLAZING_PRICES_GLASS[glazingType][sizeKey] * sqft;
      } else if (glazingMaterial === 'PLEXI' && GLAZING_PRICES_PLEXI[glazingType]?.[sizeKey]) {
        glazing = GLAZING_PRICES_PLEXI[glazingType][sizeKey] * sqft;
      }
    }
  }

  // ── Mounting ─────────────────────────────────────────────────────────────────
  let mounting = 0;
  if (mountingType && idW > 0 && idH > 0) {
    const sizeKey = getSizeKey(idW, idH);
    if (sizeKey && MOUNTING_PRICES[mountingType]?.[sizeKey]) {
      mounting = MOUNTING_PRICES[mountingType][sizeKey];
    }
  }

  // ── Misc & Hardware ──────────────────────────────────────────────────────────
  let misc = 0;
  misc += hingingType;
  misc += miscLumpSum;
  misc += miscPerInch * totalInches;
  if (crossbars)         misc += 0.30 * totalInches;
  if (spacers)           misc += 0.30 * totalInches;
  if (linenSpacer)       misc += 0.60 * totalInches;
  if (woodenSpacer)      misc += 0.90 * totalInches;
  if (metalZclips)       misc += 1.00 * odW;
  if (strainers)         misc += 0.30 * idPerimeter;
  if (hwSecurityHangers) misc += 12;
  if (hwEasels)          misc += 12;
  if (hwChloroplast)     misc += 25;
  if (mirrorType > 0 && idW > 0 && idH > 0) misc += mirrorType * totalSqFt;
  if (bevelSize > 0)     misc += bevelSize * idPerimeter;
  misc += cardboardPack;
  misc += cratePack;

  // ── Oversize surcharge ───────────────────────────────────────────────────────
  let oversize = 0;
  if      (totalInches >= 432) oversize = 4800;
  else if (totalInches >= 336) oversize = 1800;
  else if (totalInches >= 218) oversize = 400;

  // ── Markup ───────────────────────────────────────────────────────────────────
  const componentsTotal   = frame + matting + glazing + mounting + misc;
  const printingWithMarkup = printing + printing * markupPercent;
  const componentsMarkup   = componentsTotal * markupPercent;
  const markup             = (printing + componentsTotal) * markupPercent;

  // ── Totals ───────────────────────────────────────────────────────────────────
  const subtotal     = printing + componentsTotal + oversize + markup;
  const discount     = subtotal * (discountPercent / 100) + discountDollar;
  const afterDiscount = subtotal - discount;
  const tax          = afterDiscount * 0.08875;
  const total        = afterDiscount + tax;

  return {
    printing,
    frame,
    matting,
    glazing,
    mounting,
    misc,
    oversize,
    printingWithMarkup,
    componentsMarkup,
    subtotal,
    discount,
    afterDiscount,
    tax,
    total,
    totalInches,
    totalSqFt,
  };
}

export const DEFAULT_INPUTS: PricingInputs = {
  paperType: '',
  multiplePrints: 'single',
  printW: 0,
  printH: 0,
  frameW: 32,
  frameH: 42,
  dimMode: 'OD',
  frameInRate: 1.1,
  mouldingWidth: 2,
  finishMult: 1,
  finishFixed: 0,
  splinedCorners: false,
  frameOutRate: 0,
  floaterStd: 0,
  floaterOvr: 0,
  matType: '4-PLY WHITES',
  matConfig: 'BOOKMAT',
  glazingType: 'REG',
  glazingMaterial: 'GLASS',
  mountingType: 'GATORBOARD',
  hingingType: 0,
  miscLumpSum: 0,
  miscPerInch: 0,
  crossbars: false,
  spacers: false,
  linenSpacer: false,
  woodenSpacer: false,
  metalZclips: false,
  strainers: false,
  hwSecurityHangers: false,
  hwEasels: false,
  hwChloroplast: false,
  mirrorType: 0,
  bevelSize: 0,
  cardboardPack: 0,
  cratePack: 0,
  discountPercent: 0,
  discountDollar: 0,
  markupPercent: 0.28,
};
