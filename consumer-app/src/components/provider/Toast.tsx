'use client';

import { useToastStore } from '@/lib/provider/toast-store';

const ICONS: Record<string, string>  = { success: '✓', error: '!', info: 'i' };
const COLORS: Record<string, string> = { success: '#7FE0AC', error: '#F0A593', info: '#9CC2EE' };

export default function Toast() {
  const { toast, clear } = useToastStore();
  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 90, animation: 'bvtoast .35s cubic-bezier(.34,1.56,.64,1) both',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#15243B', color: '#fff',
        padding: '13px 20px 13px 16px', borderRadius: 14,
        boxShadow: '0 24px 50px -18px rgba(10,22,40,.6)',
        minWidth: 280,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'rgba(255,255,255,0.12)',
          color: COLORS[toast.kind],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontWeight: 800,
        }}>
          {ICONS[toast.kind]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{toast.title}</div>
          <div style={{ fontSize: 12, color: '#A9B6CA', marginTop: 1 }}>{toast.msg}</div>
        </div>
        <span
          onClick={clear}
          style={{ cursor: 'pointer', color: '#7F8FA6', fontSize: 18, padding: '0 4px' }}
        >
          ×
        </span>
      </div>
    </div>
  );
}
