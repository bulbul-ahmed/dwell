'use client';
import { useEffect, useCallback } from 'react';

interface Props {
  images: string[];
  labels: string[];
  activeIdx: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}

export default function Lightbox({ images, labels, activeIdx, onClose, onNav }: Props) {
  const prev = useCallback(() => onNav((activeIdx - 1 + images.length) % images.length), [activeIdx, images.length, onNav]);
  const next = useCallback(() => onNav((activeIdx + 1) % images.length), [activeIdx, images.length, onNav]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Main image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '88vw', maxHeight: '84vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <img
          src={images[activeIdx]}
          alt={labels[activeIdx] ?? ''}
          style={{
            maxWidth: '88vw', maxHeight: '78vh',
            borderRadius: 14, objectFit: 'contain',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          }}
        />

        {/* Label + counter */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          {labels[activeIdx] && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 999,
            }}>{labels[activeIdx]}</span>
          )}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {activeIdx + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          style={{
            position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
            width: 48, height: 48, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >‹</button>
      )}

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            width: 48, height: 48, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >›</button>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24,
          width: 40, height: 40, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 20,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >✕</button>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 8, padding: '8px 12px',
            background: 'rgba(0,0,0,0.5)', borderRadius: 14,
            backdropFilter: 'blur(10px)',
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => onNav(i)}
              style={{
                width: 48, height: 36, borderRadius: 7, cursor: 'pointer',
                backgroundImage: `url('${img}')`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                outline: i === activeIdx ? '2px solid #fff' : '2px solid transparent',
                opacity: i === activeIdx ? 1 : 0.55,
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
