import { useState } from 'react';
import { usePricing } from '../context/PricingContext';
import {
  PRINTING_PRICES, MATTING_PRICES,
  GLAZING_PRICES_GLASS, GLAZING_PRICES_PLEXI, MOUNTING_PRICES,
} from '../lib/pricingTables';

type MainTab = 'markup' | 'printing' | 'matting' | 'glazing' | 'mounting';
type PrintingCat = 'STANDARD' | 'FINE ART' | 'GALLERY FINE ART';
type MattingType = '4-PLY WHITES' | '4-PLY BLACKS AND COLORS' | '8-PLY WHITES';
type GlazingType = 'glass' | 'plexi';

function PriceTable({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  return (
    <table>
      <thead><tr><th>Size</th><th style={{ textAlign: 'right' }}>Price / sq ft</th></tr></thead>
      <tbody>
        {entries.map(([key, val]) => (
          <tr key={key}>
            <td style={{ fontWeight: 500 }}>{key}</td>
            <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--gold)' }}>${val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintingSubtable({ data }: { data: Record<string, Record<string, number>> }) {
  const [qty, setQty] = useState<'Standard' | 'Multiple'>('Standard');
  const sizes = Object.keys(data.Standard ?? data.Multiple ?? {});
  return (
    <>
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {(['Standard', 'Multiple'] as const).map(q => (
          <button key={q} className={`tab-btn ${qty === q ? 'active' : ''}`} onClick={() => setQty(q)}>{q}</button>
        ))}
      </div>
      <table>
        <thead><tr><th>Size</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
        <tbody>
          {sizes.map(s => (
            <tr key={s}>
              <td style={{ fontWeight: 500 }}>{s}</td>
              <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--gold)' }}>${data[qty]?.[s] ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MarkupTab() {
  const { markupPercent, setMarkupPercent } = usePricing();
  const [draft, setDraft] = useState(Math.round(markupPercent * 100));
  const [saved, setSaved] = useState(false);

  function save() {
    setMarkupPercent(draft / 100);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 440 }}>
      <p style={{ color: 'var(--gray-mid)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Global markup applied to printing and all framing components.
        Changes take effect immediately in the Configurator.
      </p>

      <div className="form-section">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Markup Percentage</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="number" min={0} max={200} value={draft}
              onChange={e => setDraft(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span style={{ color: 'var(--gray-mid)' }}>%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 4 }}>Current</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--gold)' }}>{Math.round(markupPercent * 100)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 4 }}>Multiplier</div>
            <div style={{ fontWeight: 700, fontSize: 24 }}>{(1 + markupPercent).toFixed(2)}×</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 4 }}>Stored</div>
            <div style={{ fontWeight: 700, fontSize: 24 }}>localStorage</div>
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--black)', borderRadius: 8, fontSize: 13, color: '#9ca3af', marginBottom: 20, fontFamily: 'monospace' }}>
          subtotal = (printing + components) × (1 + {markupPercent.toFixed(2)}) → tax → total
        </div>

        <button className="btn btn-primary" onClick={save} disabled={draft === Math.round(markupPercent * 100)}>
          {saved ? '✓ Saved' : 'Save Markup'}
        </button>
      </div>
    </div>
  );
}

export default function PricingAdminPage() {
  const [mainTab, setMainTab] = useState<MainTab>('markup');
  const [printCat, setPrintCat] = useState<PrintingCat>('STANDARD');
  const [mattType, setMattType] = useState<MattingType>('4-PLY WHITES');
  const [glazType, setGlazType] = useState<GlazingType>('glass');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pricing Admin</h1>
          <p style={{ color: 'var(--gray-mid)', margin: '4px 0 0', fontSize: 13 }}>View and configure pricing tables</p>
        </div>
      </div>

      <div className="pa-tab-bar">
        {(['markup', 'printing', 'matting', 'glazing', 'mounting'] as MainTab[]).map(t => (
          <button key={t} className={`pa-tab ${mainTab === t ? 'active' : ''}`} onClick={() => setMainTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>

        {mainTab === 'markup' && <MarkupTab />}

        {mainTab === 'printing' && (
          <>
            <div className="pa-tab-bar" style={{ marginBottom: 20 }}>
              {(['STANDARD', 'FINE ART', 'GALLERY FINE ART'] as PrintingCat[]).map(c => (
                <button key={c} className={`pa-tab ${printCat === c ? 'active' : ''}`} onClick={() => setPrintCat(c)}>{c}</button>
              ))}
            </div>
            <PrintingSubtable data={PRINTING_PRICES[printCat]} />
          </>
        )}

        {mainTab === 'matting' && (
          <>
            <div className="pa-tab-bar" style={{ marginBottom: 20 }}>
              {(['4-PLY WHITES', '4-PLY BLACKS AND COLORS', '8-PLY WHITES'] as MattingType[]).map(c => (
                <button key={c} className={`pa-tab ${mattType === c ? 'active' : ''}`} onClick={() => setMattType(c)}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {(['BOOKMAT', 'FLOAT'] as const).map(style => (
                <div key={style} style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 12 }}>{style}</h4>
                  <table>
                    <thead><tr><th>Size</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
                    <tbody>
                      {Object.entries(MATTING_PRICES[mattType]?.[style] ?? {}).map(([s, v]) => (
                        <tr key={s}><td style={{ fontWeight: 500 }}>{s}</td><td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 500 }}>${v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </>
        )}

        {mainTab === 'glazing' && (
          <>
            <div className="pa-tab-bar" style={{ marginBottom: 20 }}>
              <button className={`pa-tab ${glazType === 'glass' ? 'active' : ''}`} onClick={() => setGlazType('glass')}>Glass</button>
              <button className={`pa-tab ${glazType === 'plexi' ? 'active' : ''}`} onClick={() => setGlazType('plexi')}>Plexi</button>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {Object.entries(glazType === 'glass' ? GLAZING_PRICES_GLASS : GLAZING_PRICES_PLEXI).map(([type, sizes]) => (
                <div key={type} style={{ minWidth: 200 }}>
                  <h4 style={{ marginBottom: 12 }}>{type}</h4>
                  <PriceTable data={sizes} />
                </div>
              ))}
            </div>
          </>
        )}

        {mainTab === 'mounting' && (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {Object.entries(MOUNTING_PRICES).map(([material, sizes]) => (
              <div key={material} style={{ minWidth: 200 }}>
                <h4 style={{ marginBottom: 12 }}>{material}</h4>
                <table>
                  <thead><tr><th>Size</th><th style={{ textAlign: 'right' }}>Price</th></tr></thead>
                  <tbody>
                    {Object.entries(sizes).map(([s, v]) => (
                      <tr key={s}><td style={{ fontWeight: 500 }}>{s}</td><td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 500 }}>${v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
