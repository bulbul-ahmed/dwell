'use client';
import { useState } from 'react';
import Lightbox from './Lightbox';

interface Props {
  listingId: number;
  cover: string | null;
  shots: string[];
  shotCats: string[] | null;
  statusLabel: string;
  fg: string;
  bg: string;
  verified: boolean;
}

export default function ListingGallery({ listingId, cover, shots, shotCats, statusLabel, fg, bg, verified }: Props) {
  const buildImages = (c: string | null, s: string[]) => [c, ...s].filter(Boolean) as string[];
  const buildLabels = (s: string[], sc: string[] | null) => ['Cover', ...(sc ?? s.map(() => ''))];

  const [localCover, setLocalCover] = useState(cover);
  const [localShots, setLocalShots] = useState(shots);
  const [localCats, setLocalCats] = useState(shotCats);

  const allImages = buildImages(localCover, localShots);
  const allLabels = buildLabels(localShots, localCats);

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const activeImg = allImages[activeIdx] ?? null;

  async function deletePhoto(idx: number) {
    const url = allImages[idx];
    setDeleting(idx);
    await fetch('/api/admin/listings/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listingId, action: 'delete', photoUrl: url }),
    });
    if (idx === 0) {
      setLocalCover(localShots[0] ?? null);
      setLocalShots(s => s.slice(1));
      setLocalCats(c => c ? c.slice(1) : null);
    } else {
      const shotIdx = idx - 1;
      setLocalShots(s => [...s.slice(0, shotIdx), ...s.slice(shotIdx + 1)]);
      setLocalCats(c => c ? [...c.slice(0, shotIdx), ...c.slice(shotIdx + 1)] : null);
    }
    setActiveIdx(i => Math.min(i, allImages.length - 2));
    setDeleting(null);
  }

  async function setCover(idx: number) {
    if (idx === 0) return;
    const url = allImages[idx];
    await fetch('/api/admin/listings/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: listingId, action: 'set-cover', photoUrl: url }),
    });
    const shotIdx = idx - 1;
    const oldCover = localCover;
    setLocalCover(url);
    const newShots = [oldCover, ...localShots.slice(0, shotIdx), ...localShots.slice(shotIdx + 1)].filter(Boolean) as string[];
    const newCats = localCats ? ['', ...localCats.slice(0, shotIdx), ...localCats.slice(shotIdx + 1)] : null;
    setLocalShots(newShots);
    setLocalCats(newCats);
    setActiveIdx(0);
  }

  return (
    <>
      <div style={{
        background: '#fff', border: '1px solid #ECEEF1',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(20,40,70,.03)',
      }}>
        {/* Main image */}
        <div
          onClick={() => activeImg && setLightboxIdx(activeIdx)}
          style={{
            height: 300,
            backgroundImage: activeImg ? `url('${activeImg}')` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: '#DDD3C5', position: 'relative',
            cursor: activeImg ? 'zoom-in' : 'default',
          }}
        >
          {!activeImg && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0A898', fontSize: 14 }}>
              No cover photo
            </div>
          )}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: fg, background: bg, padding: '5px 12px', borderRadius: 999 }}>{statusLabel}</span>
            {verified && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', background: 'rgba(46,125,85,0.92)', padding: '5px 12px', borderRadius: 999 }}>✓ Verified</span>
            )}
          </div>
          {activeImg && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11 }}>⛶</span>
              {allImages.length > 1 ? `${activeIdx + 1} / ${allImages.length}` : '1 photo'}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 10 }}>
            {allImages.slice(0, 8).map((img, i) => {
              const label = allLabels[i] ?? '';
              const isActive = i === activeIdx;
              const isHovered = hoverIdx === i;
              const isDeleting = deleting === i;
              const isCover = i === 0;

              return (
                <div
                  key={img + i}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <div
                    onClick={() => setActiveIdx(i)}
                    style={{
                      aspectRatio: '4/3', borderRadius: 10,
                      backgroundImage: `url('${img}')`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: '#DDD3C5',
                      outline: isActive ? '2.5px solid #1E3A5C' : '2.5px solid transparent',
                      outlineOffset: -2,
                      opacity: isDeleting ? 0.4 : isActive ? 1 : 0.82,
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                  />

                  {/* Label */}
                  {label && !isHovered && (
                    <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5 }}>
                      {label}
                    </div>
                  )}

                  {/* Hover overlay */}
                  {isHovered && !isDeleting && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      background: 'rgba(15,25,45,0.6)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}>
                      {!isCover && (
                        <button
                          onClick={e => { e.stopPropagation(); setCover(i); }}
                          style={{
                            fontSize: 10, fontWeight: 700, color: '#fff',
                            background: 'rgba(255,255,255,0.18)', border: 'none',
                            borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                            backdropFilter: 'blur(4px)', width: '80%',
                          }}
                        >★ Set cover</button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deletePhoto(i); }}
                        style={{
                          fontSize: 10, fontWeight: 700, color: '#fff',
                          background: 'rgba(180,64,43,0.85)', border: 'none',
                          borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                          width: '80%',
                        }}
                      >✕ Delete</button>
                    </div>
                  )}

                  {isDeleting && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 11, color: '#B4402B', fontWeight: 700 }}>Deleting…</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={allImages}
          labels={allLabels}
          activeIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={idx => { setLightboxIdx(idx); setActiveIdx(idx); }}
        />
      )}
    </>
  );
}
