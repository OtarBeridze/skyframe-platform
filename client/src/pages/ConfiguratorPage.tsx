import { useState, useCallback } from 'react';
import { usePrice } from '../hooks/usePrice';
import { DEFAULT_INPUTS, type PricingInputs } from '../lib/pricing';
import { usePricing } from '../context/PricingContext';

const fmt = (n: number) => '$' + n.toFixed(2);

// UI-only fields that have no pricing impact (match prototype 1-for-1 but aren't in PricingInputs)
interface UIState {
  clientSelector: string;
  artDescription: string;
  artSize: string;
  lincolnFrame: string;
  weldedFrame: string;
  showSignature: string;
  whiteAllAround: string;
  framingInstructions: string;
  braceType: string;
  hwWire: boolean;
  hwDrings: boolean;
  hwSelfHanging: boolean;
  hwSoftStaples: boolean;
  hwBlackPaper: boolean;
  hwBrownPaper: boolean;
  hwTurnbuttons: boolean;
  optRagSpacers: boolean;
  optWoodenSpacers: boolean;
  optLinenSpacers: boolean;
  optRefit: boolean;
  specialtyBoard: string;
}

const DEFAULT_UI: UIState = {
  clientSelector: '',
  artDescription: '',
  artSize: '',
  lincolnFrame: '0',
  weldedFrame: '0',
  showSignature: '',
  whiteAllAround: '',
  framingInstructions: '',
  braceType: '',
  hwWire: false,
  hwDrings: false,
  hwSelfHanging: false,
  hwSoftStaples: false,
  hwBlackPaper: false,
  hwBrownPaper: false,
  hwTurnbuttons: false,
  optRagSpacers: false,
  optWoodenSpacers: false,
  optLinenSpacers: false,
  optRefit: false,
  specialtyBoard: '',
};

export default function ConfiguratorPage() {
  const { markupPercent } = usePricing();
  const [inputs, setInputs] = useState<PricingInputs>({ ...DEFAULT_INPUTS, markupPercent });
  const [ui, setUi] = useState<UIState>(DEFAULT_UI);
  const [sidebarAction, setSidebarAction] = useState<string | null>(null);

  const set = useCallback(<K extends keyof PricingInputs>(key: K, value: PricingInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const setU = <K extends keyof UIState>(key: K, value: UIState[K]) =>
    setUi(prev => ({ ...prev, [key]: value }));

  // Parse "pricePerIn|mouldingWidth" format from frame-in select
  const handleFrameIn = (raw: string) => {
    const [r, mw] = raw.split('|');
    setInputs(prev => ({ ...prev, frameInRate: parseFloat(r) || 0, mouldingWidth: parseFloat(mw) || 0 }));
  };

  // Parse "mult|fixed" format from finish select
  const handleFinish = (raw: string) => {
    const [m, f] = raw.split('|');
    setInputs(prev => ({ ...prev, finishMult: parseFloat(m) || 1, finishFixed: parseFloat(f) || 0 }));
  };

  // Parse "std|ovr" format from floater select
  const handleFloater = (raw: string) => {
    if (!raw) {
      setInputs(prev => ({ ...prev, floaterStd: 0, floaterOvr: 0 }));
    } else {
      const [s, o] = raw.split('|');
      setInputs(prev => ({ ...prev, floaterStd: parseFloat(s) || 0, floaterOvr: parseFloat(o) || 0 }));
    }
  };

  const priceInputs = { ...inputs, markupPercent };
  const price = usePrice(priceInputs);
  const markupPct = Math.round(markupPercent * 100);

  function handleSend() {
    setSidebarAction('sending');
    setTimeout(() => setSidebarAction(null), 2000);
  }

  return (
    <div className="configurator-layout">

      {/* ── Form ── */}
      <div className="configurator-form">
        <h1>Pricing Configurator</h1>

        {/* 0. CLIENT */}
        <section className="form-section">
          <h3>Client</h3>
          <div className="form-group">
            <label>Select Contact</label>
            <select value={ui.clientSelector} onChange={e => setU('clientSelector', e.target.value)} style={{ width: '100%' }}>
              <option value="">Walk-in Client (no contact)</option>
              <option value="polo">Polo Ralph Lauren</option>
              <option value="gagosian">Gagosian Gallery</option>
              <option value="lv">Louis Vuitton</option>
              <option value="conde">Condé Nast</option>
            </select>
          </div>
        </section>

        {/* 1. ART DESCRIPTION */}
        <section className="form-section">
          <h3>1. Art Description</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Art Description</label>
              <textarea
                rows={2}
                placeholder="Describe the artwork..."
                value={ui.artDescription}
                onChange={e => setU('artDescription', e.target.value)}
                style={{ resize: 'vertical', width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}
              />
            </div>
            <div className="form-group">
              <label>Art Size</label>
              <input
                type="text"
                placeholder="e.g., 24 x 36 inches"
                value={ui.artSize}
                onChange={e => setU('artSize', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 2. PRINTING */}
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

        {/* 3. FRAME DIMENSIONS */}
        <section className="form-section">
          <h3>3. Frame Dimensions</h3>
          <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
            <div>
              <label>ID (Inside)</label>
              <input type="radio" name="dim-mode" value="ID" checked={inputs.dimMode === 'ID'} onChange={() => set('dimMode', 'ID')} style={{ width: 'auto', margin: '0 0 0 8px' }} />
            </div>
            <div>
              <label>OD (Outside)</label>
              <input type="radio" name="dim-mode" value="OD" checked={inputs.dimMode === 'OD'} onChange={() => set('dimMode', 'OD')} style={{ width: 'auto', margin: '0 0 0 8px' }} />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Frame Width (inches)</label>
              <input type="number" value={inputs.frameW} onChange={e => set('frameW', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Frame Height (inches)</label>
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

        {/* 4. MOULDINGS */}
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
                <option value="">NO FRAME</option>
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
          <div className="form-grid">
            <div className="form-group">
              <label>Lincoln Frame</label>
              <input type="number" value={ui.lincolnFrame} step="0.01" onChange={e => setU('lincolnFrame', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Welded Frame</label>
              <input type="number" value={ui.weldedFrame} step="0.01" onChange={e => setU('weldedFrame', e.target.value)} />
            </div>
          </div>
        </section>

        {/* 5. FRAMING STYLE */}
        <section className="form-section">
          <h3>5. Framing Style</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Show Signature</label>
              <select value={ui.showSignature} onChange={e => setU('showSignature', e.target.value)}>
                <option value="">None</option>
                <option value="TO IMAGE">To Image</option>
              </select>
            </div>
            <div className="form-group">
              <label>Show White All Around</label>
              <select value={ui.whiteAllAround} onChange={e => setU('whiteAllAround', e.target.value)}>
                <option value="">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Framing Instructions</label>
            <textarea
              rows={2}
              placeholder="Special framing instructions..."
              value={ui.framingInstructions}
              onChange={e => setU('framingInstructions', e.target.value)}
              style={{ resize: 'vertical', width: '100%', padding: '9px 12px', border: '1px solid var(--gray-light)', borderRadius: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}
            />
          </div>
        </section>

        {/* 6. SPECIALTY HINGING */}
        <section className="form-section">
          <h3>6. Specialty Hinging</h3>
          <div className="form-grid">
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
          </div>
        </section>

        {/* 7. MOUNTING */}
        <section className="form-section">
          <h3>7. Mounting</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Mounting Type</label>
              <select value={inputs.mountingType} onChange={e => set('mountingType', e.target.value)}>
                <option value="">NO MOUNTING</option>
                <option value="FOAMCORE">Foamcore (1/4&quot;)</option>
                <option value="GATORBOARD">Gatorboard (1/4&quot;)</option>
                <option value="SINTRA">Sintra (1/8&quot;)</option>
                <option value="DIBOND">Dibond (1/8&quot;)</option>
                <option value="ACID FREE FC">Acid Free FC</option>
                <option value="4-PLY">4-Ply</option>
                <option value="8-PLY">8-Ply</option>
              </select>
            </div>
            <div className="form-group">
              <label>Brace</label>
              <select value={ui.braceType} onChange={e => setU('braceType', e.target.value)}>
                <option value="">NO BRACING</option>
                <option value="WOOD">Wood Brace</option>
                <option value="ALUMINUM">Aluminum Brace</option>
              </select>
            </div>
          </div>
        </section>

        {/* 8. GLAZING */}
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

        {/* 9. MISCELLANEOUS PRICING */}
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

        {/* 10. BACKINGS AND HARDWARE */}
        <section className="form-section">
          <h3>10. Backings and Hardware</h3>
          <div className="form-group">
            <label>Select Hardware (check all that apply)</label>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwWire} onChange={e => setU('hwWire', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Wire
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwDrings} onChange={e => setU('hwDrings', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                D-Rings
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwSelfHanging} onChange={e => setU('hwSelfHanging', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Self Hanging Strainers ($0.30/in)
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwSoftStaples} onChange={e => setU('hwSoftStaples', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Soft Staples
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={inputs.hwSecurityHangers} onChange={e => set('hwSecurityHangers', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Security Hangers ($12 total)
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={inputs.hwEasels} onChange={e => set('hwEasels', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Paper Back Easels ($12 total, up to 16×20)
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwBlackPaper} onChange={e => setU('hwBlackPaper', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Black Paper
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwBrownPaper} onChange={e => setU('hwBrownPaper', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Brown Paper
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.hwTurnbuttons} onChange={e => setU('hwTurnbuttons', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Turnbuttons
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={inputs.hwChloroplast} onChange={e => set('hwChloroplast', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Chloroplast ($25 total)
              </label>
            </div>
          </div>
        </section>

        {/* 11. OPTIONS */}
        <section className="form-section">
          <h3>11. Options</h3>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.optRagSpacers} onChange={e => setU('optRagSpacers', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Rag Spacers
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.optWoodenSpacers} onChange={e => setU('optWoodenSpacers', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Wooden Spacers
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.optLinenSpacers} onChange={e => setU('optLinenSpacers', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Linen Spacers
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ui.optRefit} onChange={e => setU('optRefit', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Refit Only (no replacement of glazing, spacers, etc.)
              </label>
            </div>
          </div>
        </section>

        {/* 12. MIRROR */}
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

        {/* 13. SPECIALTY BOARDS */}
        <section className="form-section">
          <h3>13. Specialty Boards</h3>
          <div className="form-group">
            <select value={ui.specialtyBoard} onChange={e => setU('specialtyBoard', e.target.value)} style={{ width: '100%' }}>
              <option value="">NO SPECIALTY BOARD</option>
              <option value="CRESCENT RAG">Crescent Rag Board</option>
              <option value="ARTCARE">Artcare Board</option>
              <option value="ARCHIVAL">Archival Board</option>
              <option value="CONSERVATION">Conservation Board</option>
            </select>
          </div>
        </section>

        {/* 14. PACK FOR SHIPPING */}
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

        {/* 15. MATTING */}
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

        {/* 16. PRICING */}
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

      {/* ── Live Quote Sidebar ── */}
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

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px 24px' }}
              onClick={handleSend}
            >
              {sidebarAction === 'sending' ? 'Sending…' : 'Send to Client'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}>
                Preview
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}>
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
