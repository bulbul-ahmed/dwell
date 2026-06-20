'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { LISTINGS, BOOST_PLANS, PAY_METHODS } from '@/lib/provider/data';
import { useToastStore } from '@/lib/provider/toast-store';

const STEPS = [
  { n: 1, label: 'Promotion' },
  { n: 2, label: 'Payment'   },
  { n: 3, label: 'Done'      },
];

function BoostContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const notify = useToastStore(s => s.notify);

  const listingId = parseInt(searchParams.get('listing') ?? '1');
  const listing = LISTINGS.find(l => l.id === listingId) ?? LISTINGS[0];

  const [step, setStep]           = useState(1);
  const [selPlan, setSelPlan]     = useState('7d');
  const [selPay, setSelPay]       = useState('bkash');

  const plan = BOOST_PLANS.find(p => p.key === selPlan) ?? BOOST_PLANS[1];
  const method = PAY_METHODS.find(m => m.key === selPay) ?? PAY_METHODS[0];

  function handlePay() {
    setStep(3);
    notify('Payment successful', `${plan.price} paid via ${method.label}.`, 'success');
  }

  return (
    <div className="animate-bvfade">
      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: 540, margin: '0 auto 26px' }}>
        {STEPS.map((st, i) => {
          const done   = step > st.n;
          const active = step === st.n;
          return (
            <div key={st.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : '0 0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: (done || active) ? '#1E3A5C' : '#E7EBF0',
                  color: (done || active) ? '#fff' : '#8B93A1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {done ? '✓' : st.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#15243B' : '#9AA6B6', whiteSpace: 'nowrap' }}>{st.label}</span>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, height: 2, background: done ? '#1E3A5C' : '#E7EAEE', margin: '0 12px' }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Step 1: choose plan */}
        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 26, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>Choose a promotion</h3>
            <p style={{ fontSize: 13.5, color: '#8893A4', margin: '0 0 18px' }}>
              Boosting moves <strong style={{ color: '#15243B' }}>{listing.title}</strong> to the top of search and category pages.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {BOOST_PLANS.map(p => {
                const on = selPlan === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setSelPlan(p.key)}
                    className="bv-press"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 15,
                      padding: '16px 18px', borderRadius: 14,
                      border: `1.5px solid ${on ? '#1E3A5C' : '#E7EAEE'}`,
                      background: on ? 'rgba(30,58,92,0.04)' : '#fff',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: `2px solid ${on ? '#1E3A5C' : '#CBD3DD'}`,
                      background: on ? '#1E3A5C' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: '#fff', fontSize: 12, fontWeight: 800,
                    }}>
                      {on ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap' }}>{p.name}</span>
                        {p.tag && (
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#9A7B1F', background: '#F6EFD9', padding: '2px 8px', borderRadius: 999 }}>{p.tag}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 2 }}>{p.sub}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1E3A5C' }}>{p.price}</div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              className="bv-press"
              style={{
                width: '100%', height: 48, borderRadius: 13, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff',
                background: '#1E3A5C', marginTop: 20, boxShadow: '0 12px 24px -10px rgba(30,58,92,.55)',
              }}
            >
              Continue to payment
            </button>
          </div>
        )}

        {/* Step 2: payment */}
        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 26, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15243B', margin: '0 0 18px' }}>Payment method</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 11, marginBottom: 20 }}>
              {PAY_METHODS.map(m => {
                const on = selPay === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setSelPay(m.key)}
                    className="bv-press"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 15, borderRadius: 13,
                      border: `1.5px solid ${on ? '#1E3A5C' : '#E7EAEE'}`,
                      background: on ? 'rgba(30,58,92,0.04)' : '#fff',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: m.logoBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                      {m.logo}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Summary */}
            <div style={{ background: '#F7F9FC', border: '1px solid #EDF1F6', borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                <span style={{ fontSize: 13, color: '#8893A4' }}>Promotion</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap' }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                <span style={{ fontSize: 13, color: '#8893A4' }}>Listing</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{listing.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 11, borderTop: '1px solid #E7EBF0' }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#15243B' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1E3A5C' }}>{plan.price}</span>
              </div>
            </div>
            <button
              onClick={handlePay}
              className="bv-press"
              style={{
                width: '100%', height: 48, borderRadius: 13, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #2E7D55, #246046)',
                boxShadow: '0 12px 24px -10px rgba(46,125,85,.6)',
              }}
            >
              Pay {plan.price} with {method.label}
            </button>
            <p style={{ fontSize: 11.5, color: '#AEB8C6', textAlign: 'center', margin: '12px 0 0' }}>
              Secured via certified gateway · no card details stored
            </p>
          </div>
        )}

        {/* Step 3: success */}
        {step === 3 && (
          <div className="animate-bvpop" style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '44px 32px', textAlign: 'center', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: '#E7F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#2E7D55" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#15243B', margin: '0 0 8px' }}>Your listing is boosted 🚀</h3>
            <p style={{ fontSize: 14, color: '#8893A4', margin: '0 auto 24px', maxWidth: 380, lineHeight: 1.6 }}>
              <strong style={{ color: '#15243B' }}>{listing.title}</strong> is now featured at the top of search for {plan.duration}. Expect 3–5× more views.
            </p>
            <button
              onClick={() => router.push('/listings')}
              className="bv-press"
              style={{ height: 46, padding: '0 28px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff', background: '#1E3A5C' }}
            >
              Back to listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoostPage() {
  return (
    <Suspense fallback={null}>
      <BoostContent />
    </Suspense>
  );
}
