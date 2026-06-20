'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';

const ACCENT = '#1E3A5C';

interface IntentData {
  stats: { label: string; value: string; note: string }[];
  sizeRows: { label: string; value: string; w: string }[];
  blocks: number[];
  blockLabels: string[];
  trend: number[];
  trendMonths: string[];
  sampleSize: number;
}
type InsightsData = { rent: IntentData; buy: IntentData };

const EMPTY: IntentData = { stats: [], sizeRows: [], blocks: [], blockLabels: [], trend: [], trendMonths: [], sampleSize: 0 };

function compactTk(n: number): string {
  if (!n) return '—';
  if (n >= 1e7) return `৳${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `৳${Math.round(n / 1e5)}L`;
  if (n >= 1e3) return `৳${Math.round(n / 1e3)}k`;
  return `৳${Math.round(n)}`;
}

function buildTrend(vals: number[]) {
  const W = 600, H = 220;
  const tMin = Math.min(...vals), tMax = Math.max(...vals);
  const tx = (i: number) => ((i / (vals.length - 1)) * W).toFixed(1);
  const ty = (v: number) => (H - ((v - tMin) / (tMax - tMin || 1)) * (H - 30) - 12).toFixed(1);
  const pts = vals.map((v, i) => `${tx(i)},${ty(v)}`).join(' ');
  const area = `M0,${H} ` + vals.map((v, i) => `L${tx(i)},${ty(v)}`).join(' ') + ` L${W},${H} Z`;
  return { pts, area };
}

export default function InsightsPage() {
  const [intent, setIntent] = useState<'rent' | 'buy'>('rent');
  const [data, setData] = useState<InsightsData | null>(null);
  const isRent = intent === 'rent';

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const d = data ? data[intent] : EMPTY;
  const stats = d.stats;
  const sizeRows = d.sizeRows;
  const blockVals = d.blocks;
  const blockLabels = d.blockLabels;
  const blockMax = Math.max(1, ...blockVals);
  const hasTrend = d.trend.length >= 2;
  const { pts: trendLine, area: trendArea } = buildTrend(hasTrend ? d.trend : [0, 0]);
  const trendMonths = d.trendMonths;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg" style={{ animation: 'bvfade .4s ease both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F4F1EB', border: '1px solid #ECE6DA', borderRadius: 999, padding: '6px 13px', fontSize: 12, fontWeight: 600, color: '#8A7E66', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F8A6B' }} />
              Updated weekly · verified data only
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 44, lineHeight: 1.05, margin: 0, color: '#15243B' }}>Aftab Nagar market insights</h1>
            <p style={{ fontSize: 15, color: '#6A7180', margin: '10px 0 0', maxWidth: 560 }}>Real prices from physically verified listings — the numbers competitors can't show because they can't verify supply.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 13, padding: 5 }}>
            {(['rent', 'buy'] as const).map(k => {
              const on = intent === k;
              return (
                <button
                  key={k}
                  onClick={() => setIntent(k)}
                  style={{ padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: on ? '#fff' : '#5A6172', background: on ? ACCENT : 'transparent', transition: 'all .25s' }}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="g4" style={{ marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 20, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8893A4' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.6px', color: '#15243B', margin: '9px 0 5px' }}>{s.value}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700 }}>
                <span style={{ color: '#AEB8C6', fontWeight: 600 }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trend chart + Size bars */}
        <div className="g-insights-split" style={{ marginBottom: 20 }}>
          {/* Trend line */}
          <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>{isRent ? 'Average rent trend' : 'Average asking price trend'}</h3>
            <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 16px' }}>Avg listed price by month · Aftab Nagar</p>
            {hasTrend ? (
              <>
                <svg width="100%" height="220" viewBox="0 0 600 220" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <line x1="0" y1="55" x2="600" y2="55" stroke="#F0F3F7" strokeWidth="1" />
                  <line x1="0" y1="110" x2="600" y2="110" stroke="#F0F3F7" strokeWidth="1" />
                  <line x1="0" y1="165" x2="600" y2="165" stroke="#F0F3F7" strokeWidth="1" />
                  <defs>
                    <linearGradient id="insg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#1E3A5C" />
                      <stop offset="1" stopColor="#1E3A5C" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={trendArea} fill="url(#insg)" opacity="0.14" />
                  <polyline points={trendLine} fill="none" stroke="#1E3A5C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  {trendMonths.map((m, i) => (
                    <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA6B6' }}>{m}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA6B6', fontSize: 13.5, textAlign: 'center', padding: '0 20px' }}>
                Not enough listing history yet to chart a price trend.
              </div>
            )}
          </div>

          {/* Rent by bedrooms */}
          <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>{isRent ? 'Rent by bedrooms' : 'Price by bedrooms'}</h3>
            <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 16px' }}>{isRent ? 'Average monthly rent' : 'Average asking price'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {sizeRows.map(r => (
                <div key={r.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#44506A' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#15243B' }}>{r.value}</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: r.w, borderRadius: 999, background: 'linear-gradient(90deg,#2C557F,#1E3A5C)', transformOrigin: 'left', animation: 'bvrise .7s cubic-bezier(.22,1,.36,1) both' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block bar chart */}
        <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>{isRent ? 'Average rent by block' : 'Average price by block'}</h3>
          <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 16px' }}>Compare neighbourhoods at a glance</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
            {blockVals.map((v, i) => {
              const pct = Math.round((v / blockMax) * 100) + '%';
              const isTop = v === blockMax;
              const bg = isTop ? 'linear-gradient(180deg,#C9A24B,#A67C2E)' : 'linear-gradient(180deg,#2C557F,#1E3A5C)';
              const label = compactTk(v);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#15243B' }}>{label}</div>
                  <div style={{ width: '100%', height: pct, minHeight: 6, borderRadius: '8px 8px 0 0', background: bg, transformOrigin: 'bottom', animation: 'bvrise .7s cubic-bezier(.22,1,.36,1) both' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#9AA6B6' }}>{blockLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
