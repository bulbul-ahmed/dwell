'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/provider/toast-store';

export interface ReviewRow {
  id: number;
  by: string;
  when: string;
  context: string;
  stars: string;
  rating: number;
  text: string;
  avBg: string;
  initial: string;
  reply: string | null;
}

interface StarCount { star: number; count: number; w: string }

interface Props {
  reviews: ReviewRow[];
  totalReviews: number;
  avgRating: number;
  starCounts: StarCount[];
}

export default function ReviewsClient({ reviews, totalReviews, avgRating, starCounts }: Props) {
  const [replied, setReplied] = useState<Set<number>>(new Set());
  const notify = useToastStore(s => s.notify);

  function handleReply(id: number) {
    setReplied(prev => new Set([...prev, id]));
    notify('Reply posted', 'Your response is now public on this review.', 'success');
  }

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22, alignItems: 'start' }}>
        {/* Rating summary */}
        <div style={{ position: 'sticky', top: 86, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px solid #F2F4F7' }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: '#15243B', letterSpacing: -1, lineHeight: 1 }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: 16, color: '#C9A24B', margin: '7px 0 4px', letterSpacing: 2 }}>
              {totalReviews > 0 ? '★'.repeat(Math.round(avgRating)) : '☆☆☆☆☆'}
            </div>
            <div style={{ fontSize: 12.5, color: '#8893A4' }}>Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
            {starCounts.map(r => (
              <div key={r.star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8893A4', width: 28 }}>{r.star}★</span>
                <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden' }}>
                  <div className="animate-bvriseX" style={{ height: '100%', width: r.w, borderRadius: 999, background: '#C9A24B', transformOrigin: 'left' }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA6B6', width: 24, textAlign: 'right' }}>{r.count}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: 14, background: '#F7F9FC', borderRadius: 13 }}>
            <div style={{ fontSize: 12, color: '#8893A4' }}>Response rate</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2E7D55', marginTop: 3 }}>
              {totalReviews > 0 ? `${Math.round((replied.size / totalReviews) * 100)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#8893A4', fontSize: 14 }}>
              No reviews yet — they will appear here once renters leave feedback.
            </div>
          ) : reviews.map(r => {
            const hasReplied = replied.has(r.id);
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: r.avBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
                    {r.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B' }}>{r.by}</div>
                    <div style={{ fontSize: 12, color: '#9AA6B6' }}>{r.when} · {r.context}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#C9A24B', letterSpacing: 1 }}>{r.stars}</span>
                </div>
                {r.text && (
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#44506A', margin: 0 }}>{r.text}</p>
                )}
                {hasReplied && (
                  <div style={{ marginTop: 14, padding: '14px 16px', background: '#F7F9FC', borderRadius: 13, borderLeft: '3px solid #2C557F' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1E3A5C', marginBottom: 4 }}>Your reply</div>
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: '#44506A', margin: 0 }}>Thank you for your kind feedback!</p>
                  </div>
                )}
                {!hasReplied && (
                  <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
                    <button onClick={() => handleReply(r.id)} className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', height: 36, padding: '0 15px', borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#1E3A5C' } as React.CSSProperties}>
                      Reply
                    </button>
                    <button onClick={() => notify('Review reported', 'Sent to moderators for review.', 'info')} className="bv-press bv-fill" style={{ '--fill': '#F8E8E3', height: 36, padding: '0 13px', borderRadius: 10, border: '1px solid #F0D9D2', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#B4402B' } as React.CSSProperties}>
                      Report
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
