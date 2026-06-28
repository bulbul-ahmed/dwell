'use client';

import { useState } from 'react';
import { ArrowDownToLine, X, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '@/lib/provider/toast-store';

const ACCENT = '#1E3A5C';

type Method = 'bkash' | 'bank';

interface Props {
  available: number;
}

export default function WithdrawModal({ available }: Props) {
  const [open, setOpen]       = useState(false);
  const [method, setMethod]   = useState<Method>('bkash');
  const [amount, setAmount]   = useState('');
  const [account, setAccount] = useState('');
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const notify = useToastStore(s => s.notify);

  const maxAmount = available;
  const parsed    = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const valid     = parsed >= 500 && parsed <= maxAmount && account.trim().length >= 8;

  function close() {
    setOpen(false);
    setTimeout(() => { setDone(false); setAmount(''); setAccount(''); }, 300);
  }

  async function submit() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setDone(true);
    notify('Withdrawal requested', `৳${parsed.toLocaleString()} via ${method === 'bkash' ? 'bKash' : 'Bank'} — processing in 1–3 days.`, 'success');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          height: 34, padding: '0 14px', borderRadius: 9,
          border: `1px solid ${ACCENT}`, background: '#EEF3FB',
          color: ACCENT, fontSize: 12.5, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <ArrowDownToLine size={13} strokeWidth={2} />
        Withdraw
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,25,45,0.38)', backdropFilter: 'blur(4px)' }} />

          <div style={{
            position: 'relative', background: '#fff', borderRadius: 22,
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'bvSlideUp .32s cubic-bezier(.22,1,.36,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 16px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15243B', margin: 0 }}>Withdraw earnings</h3>
              <button onClick={close} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #ECEEF1', background: '#F7F8FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} color="#8893A4" strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: '0 22px 22px' }}>
              {done ? (
                <div style={{ textAlign: 'center', padding: '28px 0 16px' }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#E7F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <CheckCircle2 size={26} color="#2E7D55" strokeWidth={2} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#15243B', marginBottom: 6 }}>Withdrawal submitted!</div>
                  <div style={{ fontSize: 13.5, color: '#8893A4', lineHeight: 1.5 }}>
                    ৳{parsed.toLocaleString()} will arrive in your {method === 'bkash' ? 'bKash' : 'bank account'} within 1–3 business days.
                  </div>
                  <button onClick={close} style={{ marginTop: 20, height: 44, padding: '0 32px', borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Available balance */}
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: '#EEF3FB', marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8893A4', marginBottom: 4 }}>Available to withdraw</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 }}>৳{available.toLocaleString()}</div>
                    <div style={{ fontSize: 11.5, color: '#9AA6B6', marginTop: 3 }}>Minimum withdrawal ৳500</div>
                  </div>

                  {/* Method tabs */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#41495A', marginBottom: 8 }}>Payment method</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([['bkash', 'bKash'], ['bank', 'Bank transfer']] as [Method, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setMethod(key)}
                          style={{
                            flex: 1, height: 44, borderRadius: 11,
                            border: method === key ? `2px solid ${ACCENT}` : '1px solid #ECEEF1',
                            background: method === key ? '#EEF3FB' : '#fff',
                            color: method === key ? ACCENT : '#41495A',
                            fontSize: 13, fontWeight: method === key ? 800 : 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account field */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#41495A', display: 'block', marginBottom: 6 }}>
                      {method === 'bkash' ? 'bKash number' : 'Bank account number'}
                    </label>
                    <input
                      type="text"
                      value={account}
                      onChange={e => setAccount(e.target.value)}
                      placeholder={method === 'bkash' ? '01XXXXXXXXX' : 'Account number'}
                      style={{ width: '100%', height: 44, borderRadius: 11, border: '1px solid #ECEEF1', padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: '#15243B', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Amount field */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#41495A', display: 'block', marginBottom: 6 }}>
                      Amount (৳)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: '#9AA6B6' }}>৳</span>
                      <input
                        type="text"
                        value={amount}
                        onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                        style={{ width: '100%', height: 44, borderRadius: 11, border: '1px solid #ECEEF1', padding: '0 14px 0 28px', fontSize: 15, fontFamily: 'inherit', fontWeight: 700, color: '#15243B', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => setAmount(String(maxAmount))}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', height: 26, padding: '0 10px', borderRadius: 7, border: 'none', background: '#EEF3FB', color: ACCENT, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Max
                      </button>
                    </div>
                    {parsed > maxAmount && (
                      <div style={{ fontSize: 11.5, color: '#C7553B', marginTop: 5, fontWeight: 600 }}>Exceeds available balance</div>
                    )}
                  </div>

                  <button
                    onClick={submit}
                    disabled={!valid || loading}
                    style={{
                      width: '100%', height: 48, borderRadius: 13, border: 'none',
                      background: valid && !loading ? ACCENT : '#D4DBE6',
                      color: '#fff', fontSize: 15, fontWeight: 800,
                      cursor: valid && !loading ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                        Processing…
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine size={16} strokeWidth={2.2} />
                        Withdraw ৳{parsed > 0 ? parsed.toLocaleString() : '—'}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bvSlideUp { from { opacity:0; transform:translateY(24px) scale(.96) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
