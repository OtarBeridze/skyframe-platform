import { useState, useCallback } from 'react';
import { usePrice } from '../hooks/usePrice';
import { DEFAULT_INPUTS, type PricingInputs } from '../lib/pricing';

const fmt = (n: number) => '$' + n.toFixed(2);

export default function ConfiguratorPage() {
  const [inputs, setInputs] = useState<PricingInputs>(DEFAULT_INPUTS);

  const set = useCallback(<K extends keyof PricingInputs>(key: K, value: PricingInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // Parse "pricePerIn|mouldingWidth" format from frame-in select
  const handleFrameIn = (raw: string) => {
    const parts = raw.split('|');
    const rate  = parseFloat(parts[0]) || 0;
    const mw    = parseFloat(parts[1]) || 0;
    setInputs(prev => ({ ...prev, frameInRate: rate, mouldingWidth: mw }));
  };

  // Parse "mult|fixed" format from finish select
  const handleFinish = (raw: string) => {
    const parts = raw.split('|');
    setInputs(prev => ({ ...prev, finishMult: parseFloat(parts[0]) || 1, finishFixed: parseFloat(parts[1]) || 0 }));
  };

  // Parse "std|ovr" format from floater select
  const handleFloater = (raw: string) => {
    if (!raw) {
      setInputs(prev => ({ ...prev, floaterStd: 0, floaterOvr: 0 }));
    } else {
      const parts = raw.split('|');
      setInputs(prev => ({ ...prev, floaterStd: parseFloat(parts[0]) || 0, floaterOvr: parseFloat(parts[1]) || 0 }));
    }
  };

  const price = usePrice(inputs);
  const markupPct = Math.round(inputs.markupPercent * 100);

  return (
    <div className="configurator-layout">
      {/* ── Form ── */}
      <div className="configurator-form">
        <h1>Configurator</h1>

        {/* 1. Client */}
        <section className="form-section">
          <h3>1. Client Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" placeholder="Client name" />
            </div>
            <div className="form-group">
              <label>Order #</label>
              <input type="text" placeholder="Order number" />
            </div>
          </div>
        </section>

        {/* 2. Printing */}
        <section className="form-section">
          <h3>2. Printing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Paper Type</label>
              <select value={inputs.paperType} onChange={e => set('paperType', e.target.value)}>
                <option value="">No Printing</option>
                <optgroup label="Standard">
                  <option value="ENHANCED MATTE">Enhanced Matte</option>
                  <option value="PREMIUM LUSTRE">Premium Lustre</option>
                  <option value="PREMIUM GLOSSY">Premium Glossy</option>
                  <option value="SOMERSET VELVET">Somerset Velvet</option>
                  <option value="EPSON EXHIBITION">Epson Exhibition</option>
                </optgroup>
                <optgroup label="Fine Art">
                  <option value="HAHNEMUHLE">Hahnemühle</option>
                  <option value="ILLFORD">Illford</option>
                  <option value="CANSON">Canson</option>
                  <option value="MUSEO">Museo</option>
                  <option value="MOAB">Moab</option>
                </optgroup>
                <optgroup label="Gallery Fine Art">
                  <option value="CANVAS">Canvas</option>
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label>Multiple Prints</label>
              <select value={inputs.multiplePrints} onChange={e => set('multiplePrints', e.target.value as 'single' | 'multiple')}>
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
              </select>
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Print Width (in)</label>
              <input type="number" value={inputs.printW || ''} onChange={e => set('printW', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Print Height (in)</label>
              <input type="number" value={inputs.printH || ''} onChange={e => set('printH', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Max Size</label>
              <input type="text" value='58" × 96"' readOnly style={{ background: 'var(--gray-light)' }} />
            </div>
          </div>
        </section>

        {/* 3. Frame Dimensions */}
        <section className="form-section">
          <h3>3. Frame Dimensions</h3>
          <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="dim-mode" value="ID" checked={inputs.dimMode === 'ID'} onChange={() => set('dimMode', 'ID')} style={{ width: 'auto', margin: 0 }} />
              ID (Inside)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="dim-mode" value="OD" checked={inputs.dimMode === 'OD'} onChange={() => set('dimMode', 'OD')} style={{ width: 'auto', margin: 0 }} />
              OD (Outside)
            </label>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Frame Width (in)</label>
              <input type="number" value={inputs.frameW} onChange={e => set('frameW', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Frame Height (in)</label>
              <input type="number" value={inputs.frameH} onChange={e => set('frameH', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Total Linear Inches</label>
              <input type="text" value={price.totalInches.toFixed(0)} readOnly style={{ background: 'var(--gray-light)' }} />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Total Sq Ft</label>
              <input type="text" value={price.totalSqFt.toFixed(2)} readOnly style={{ background: 'var(--gray-light)' }} />
            </div>
          </div>
        </section>

        {/* 4. Mouldings */}
        <section className="form-section">
          <h3>4. Mouldings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Frame In</label>
              <select
                value={`${inputs.frameInRate}|${inputs.mouldingWidth}`}
                onChange={e => handleFrameIn(e.target.value)}
              >
                <option value="0|0">NO FRAME</option>
                <option value="1.25|1.5">D-ASH ($1.25/in)</option>
                <option value="1.75|1.75">JB-13 POPLAR ($1.75/in)</option>
                <option value="1.9|1.75">J-43 POPLAR ($1.9/in)</option>
                <option value="1.55|1.5">1.5&quot; POPLAR ($1.55/in)</option>
                <option value="2.05|3">3&quot; POPLAR ($2.05/in)</option>
                <option value="1.1|2">C-MAPLE ($1.1/in)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Finish</label>
              <select
                value={`${inputs.finishMult}|${inputs.finishFixed}`}
                onChange={e => handleFinish(e.target.value)}
              >
                <option value="1|0">BLACK (1×)</option>
                <option value="1|0">WHITE (1×)</option>
                <option value="1|0">NATURAL (1×)</option>
                <option value="1.5|0">303 DARK MAHOGANY (1.5×)</option>
                <option value="2|0">SHINY BLACK LACQUER (2×)</option>
                <option value="2|80">CUSTOM LACQUER # (2× + $80)</option>
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Frame Out / Fillet</label>
              <select value={inputs.frameOutRate || ''} onChange={e => set('frameOutRate', parseFloat(e.target.value) || 0)}>
                <option value="">NO FRAME OUT</option>
                <option value="1.25">D-ASH ($1.25/in)</option>
                <option value="1.75">JB-13 POPLAR ($1.75/in)</option>
                <option value="1.55">1.5&quot; POPLAR ($1.55/in)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Floater Frame</label>
              <select
                value={inputs.floaterStd ? `${inputs.floaterStd}|${inputs.floaterOvr}` : ''}
                onChange={e => handleFloater(e.target.value)}
              >
                <option value="">NO FLOATER</option>
                <option value="2|2.5">1/2&quot; × 2&quot; Floater (Poplar)</option>
                <option value="2.5|3">1/2&quot; × 3&quot; Floater (Poplar)</option>
                <option value="3|3.5">1/2&quot; × 4&quot; Floater (Poplar)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={inputs.splinedCorners} onChange={e => set('splinedCorners', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
              Splined Corners (+$100 per frame)
            </label>
          </div>
        </section>

        {/* 6. Specialty Hinging */}
        <section className="form-section">
          <h3>6. Specialty Hinging</h3>
          <div className="form-group">
            <label>Hinging Type</label>
            <select value={inputs.hingingType || ''} onChange={e => set('hingingType', parseFloat(e.target.value) || 0)}>
              <option value="">NO HINGING</option>
              <option value="35">Japanese (up to 16&quot; × 20&quot;) — $35</option>
              <option value="35">Japanese (up to 30&quot; × 40&quot;) — $35</option>
              <option value="35">Japanese (up to 40&quot; × 60&quot;) — $35</option>
              <option value="35">Japanese (up to 48&quot; × 96&quot;) — $35</option>
              <option value="100">Silicon — $100</option>
              <option value="100">Stitches — $100</option>
            </select>
          </div>
        </section>

        {/* 7. Mounting */}
        <section className="form-section">
          <h3>7. Mounting</h3>
          <div className="form-group">
            <label>Mounting Type</label>
            <select value={inputs.mountingType} onChange={e => set('mountingType', e.target.value)}>
              <option value="">NO MOUNTING</option>
              <option value="FOAMCORE">Foamcore (1/4&quot;)</option>
              <option value="GATORBOARD">Gatorboard (1/4&quot;)</option>
              <option value="SINTRA">Sintra (1/8&quot;)</option>
              <option value="DIBOND">Dibond (1/8&quot;)</option>
            </select>
          </div>
        </section>

        {/* 8. Glazing */}
        <section className="form-section">
          <h3>8. Glazing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Material</label>
              <select value={inputs.glazingMaterial} onChange={e => set('glazingMaterial', e.target.value as 'GLASS' | 'PLEXI')}>
                <option value="GLASS">Glass</option>
                <option value="PLEXI">Plexiglass</option>
              </select>
            </div>
            <div className="form-group">
              <label>Glass Type</label>
              <select value={inputs.glazingType} onChange={e => set('glazingType', e.target.value)}>
                <option value="">NO GLAZING</option>
                <option value="REG">Regular Glass</option>
                <option value="NON-GLARE">Non-Glare Glass</option>
                <option value="U.V.">UV Glass</option>
                <option value="MUSEUM">Museum Glass</option>
              </select>
            </div>
          </div>
        </section>

        {/* 9. Miscellaneous */}
        <section className="form-section">
          <h3>9. Miscellaneous Pricing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Lump Sum ($)</label>
              <input type="number" value={inputs.miscLumpSum || ''} step="0.01" onChange={e => set('miscLumpSum', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Per Inch ($/in)</label>
              <input type="number" value={inputs.miscPerInch || ''} step="0.01" onChange={e => set('miscPerInch', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          {([
            ['crossbars',    'Crossbars ($0.30/in)'],
            ['spacers',      'Spacers ($0.30/in)'],
            ['linenSpacer',  'Linen Spacers ($0.60/in)'],
            ['woodenSpacer', 'Wooden Spacers ($0.90/in)'],
            ['metalZclips',  'Metal Z-Clips ($1.00/in — width only)'],
            ['strainers',    '1/2"/3/4" Wood Strainer/Z-Clip ($0.30/in)'],
          ] as [keyof PricingInputs, string][]).map(([key, label]) => (
            <div className="form-group" key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!inputs[key]} onChange={e => set(key, e.target.checked as PricingInputs[typeof key])} style={{ width: 'auto', margin: 0 }} />
                {label}
              </label>
            </div>
          ))}
        </section>

        {/* 10. Backings & Hardware */}
        <section className="form-section">
          <h3>10. Backings and Hardware</h3>
          {([
            ['hwSecurityHangers', 'Security Hangers ($12 total)'],
            ['hwEasels',          'Paper Back Easels ($12 total, up to 16×20)'],
            ['hwChloroplast',     'Chloroplast ($25 total)'],
          ] as [keyof PricingInputs, string][]).map(([key, label]) => (
            <div className="form-group" key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!inputs[key]} onChange={e => set(key, e.target.checked as PricingInputs[typeof key])} style={{ width: 'auto', margin: 0 }} />
                {label}
              </label>
            </div>
          ))}
        </section>

        {/* 12. Mirror */}
        <section className="form-section">
          <h3>12. Mirror</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Mirror Type</label>
              <select value={inputs.mirrorType || ''} onChange={e => set('mirrorType', parseFloat(e.target.value) || 0)}>
                <option value="">NO MIRROR</option>
                <option value="18">Regular Mirror ($18/sq ft)</option>
                <option value="58">Stock Antique Mirror ($58/sq ft)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bevel Size</label>
              <select value={inputs.bevelSize || ''} onChange={e => set('bevelSize', parseFloat(e.target.value) || 0)}>
                <option value="">NO BEVEL</option>
                <option value="0.75">3/4&quot; ($0.75/in)</option>
                <option value="1">1&quot; ($1.00/in)</option>
                <option value="1.25">1 1/4&quot; ($1.25/in)</option>
                <option value="1.5">1 1/2&quot; ($1.50/in)</option>
                <option value="2">2&quot; ($2.00/in)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 14. Pack for Shipping */}
        <section className="form-section">
          <h3>14. Pack for Shipping</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Cardboard Packaging</label>
              <select value={inputs.cardboardPack || ''} onChange={e => set('cardboardPack', parseFloat(e.target.value) || 0)}>
                <option value="">NO CARDBOARD</option>
                <option value="30">Up to 30&quot; × 40&quot; — $30</option>
                <option value="50">Up to 40&quot; × 60&quot; — $50</option>
                <option value="75">Up to 60&quot; × 80&quot; — $75</option>
              </select>
            </div>
            <div className="form-group">
              <label>Crate Packaging</label>
              <select value={inputs.cratePack || ''} onChange={e => set('cratePack', parseFloat(e.target.value) || 0)}>
                <option value="">NO CRATE</option>
                <option value="78">20&quot; × 24&quot; × 4&quot; — $78</option>
                <option value="115">20&quot; × 30&quot; × 4&quot; — $115</option>
                <option value="130">24&quot; × 30&quot; × 4&quot; — $130</option>
                <option value="190">30&quot; × 40&quot; × 4&quot; — $190</option>
                <option value="268">40&quot; × 50&quot; × 4&quot; — $268</option>
                <option value="498">48&quot; × 96&quot; × 4&quot; — $498</option>
                <option value="650">60&quot; × 96&quot; × 4&quot; — $650</option>
              </select>
            </div>
          </div>
        </section>

        {/* 15. Matting */}
        <section className="form-section">
          <h3>15. Matting</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Mat Type</label>
              <select value={inputs.matType} onChange={e => set('matType', e.target.value)}>
                <option value="">NO MAT</option>
                <option value="4-PLY WHITES">4-PLY WHITES</option>
                <option value="4-PLY BLACKS AND COLORS">4-PLY BLACKS AND COLORS</option>
                <option value="8-PLY WHITES">8-PLY WHITES</option>
              </select>
            </div>
            <div className="form-group">
              <label>Configuration</label>
              <select value={inputs.matConfig} onChange={e => set('matConfig', e.target.value)}>
                <option value="BOOKMAT">Bookmat Only</option>
                <option value="FLOAT">Float Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* 16. Pricing */}
        <section className="form-section">
          <h3>16. Pricing</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Discount %</label>
              <input type="number" value={inputs.discountPercent || ''} step="0.1" min="0" max="100" onChange={e => set('discountPercent', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Discount $ (fixed amount)</label>
              <input type="number" value={inputs.discountDollar || ''} step="0.01" min="0" onChange={e => set('discountDollar', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </section>
      </div>

      {/* ── Live Quote Panel ── */}
      <aside className="quote-sidebar">
        <div className="price-panel">
          <h3>Live Quote</h3>
          <div id="price-breakdown">
            <div className="price-line">
              <span>Printing</span>
              <span className="price-amount">{fmt(price.printingWithMarkup)}</span>
            </div>
            <div className="price-line">
              <span>Frame</span>
              <span className="price-amount">{fmt(price.frame)}</span>
            </div>
            <div className="price-line">
              <span>Matting</span>
              <span className="price-amount">{fmt(price.matting)}</span>
            </div>
            <div className="price-line">
              <span>Glazing</span>
              <span className="price-amount">{fmt(price.glazing)}</span>
            </div>
            <div className="price-line">
              <span>Mounting</span>
              <span className="price-amount">{fmt(price.mounting)}</span>
            </div>
            <div className="price-line">
              <span>Misc &amp; Hardware</span>
              <span className="price-amount">{fmt(price.misc)}</span>
            </div>
            <div className="price-line">
              <span>Oversize Surcharge</span>
              <span className="price-amount">{fmt(price.oversize)}</span>
            </div>
            <div className="price-line">
              <span>Markup ({markupPct}%)</span>
              <span className="price-amount">{fmt(price.componentsMarkup)}</span>
            </div>
            <div className="price-line total">
              <span>SUBTOTAL</span>
              <span className="price-amount">{fmt(price.subtotal)}</span>
            </div>
            <div className="price-line">
              <span>Discount</span>
              <span className="price-amount" style={{ color: price.discount > 0 ? '#e53e3e' : undefined }}>
                {price.discount > 0 ? '-' : ''}{fmt(price.discount)}
              </span>
            </div>
            <div className="price-line">
              <span>NY Tax (8.875%)</span>
              <span className="price-amount">{fmt(price.tax)}</span>
            </div>
            <div className="price-line total" style={{ marginTop: 8 }}>
              <span>TOTAL</span>
              <span className="price-amount">{fmt(price.total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
