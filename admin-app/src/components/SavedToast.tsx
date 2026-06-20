'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SavedToast() {
  const params = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (params.get('saved') === '1') {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
  }, [params]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
      background: '#1E3A5C', color: '#fff', borderRadius: 14,
      padding: '13px 22px', boxShadow: '0 12px 32px rgba(15,25,45,0.28)',
      fontSize: 14, fontWeight: 700,
      animation: 'bvfade .3s cubic-bezier(.22,1,.36,1) both',
    }}>
      <span style={{ fontSize: 16 }}>✓</span>
      Listing saved successfully
      <button
        onClick={() => setVisible(false)}
        style={{ marginLeft: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
      >✕</button>
    </div>
  );
}
