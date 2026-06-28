'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type DayStatus = 'available' | 'unavailable' | 'pending' | 'booked';

interface DayMeta { status: DayStatus }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const STATUS_STYLE: Record<DayStatus, { bg: string; fg: string; label: string }> = {
  available:   { bg: '#E7F1EC', fg: '#2E7D55', label: 'Available' },
  unavailable: { bg: '#F0F2F5', fg: '#8893A4', label: 'Blocked' },
  pending:     { bg: '#FEF3E2', fg: AMBER,     label: 'Pending' },
  booked:      { bg: '#EEF3FB', fg: ACCENT,    label: 'Booked' },
};

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dayMeta, setDayMeta] = useState<Record<string, DayMeta>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [setStatusFor, setSetStatusFor] = useState<string | null>(null);

  const daysInMonth   = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const key = (d: number) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const setStatus = (d: number, status: DayStatus) => {
    setDayMeta(prev => ({ ...prev, [key(d)]: { status } }));
    setSetStatusFor(null);
  };

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const counts = Object.values(dayMeta).reduce((acc, { status }) => {
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-bvfade" style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: '#15243B', margin: 0 }}>Availability Calendar</h2>
        <p style={{ fontSize: 14, color: '#8893A4', margin: '5px 0 0' }}>Mark dates as available, blocked, or pending for your listings</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {(Object.entries(STATUS_STYLE) as [DayStatus, typeof STATUS_STYLE[DayStatus]][]).map(([status, { bg, fg, label }]) => (
          <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, background: bg, fontSize: 12, fontWeight: 700, color: fg }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: fg, display: 'inline-block' }} />
            {label}
            {counts[status] ? <span style={{ opacity: 0.7 }}>· {counts[status]}</span> : null}
          </span>
        ))}
      </div>

      {/* Calendar card */}
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 20, padding: '22px 24px', boxShadow: '0 1px 3px rgba(20,40,70,.04)' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #ECEEF1', background: '#F7F8FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={17} color="#41495A" strokeWidth={2} />
          </button>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #ECEEF1', background: '#F7F8FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={17} color="#41495A" strokeWidth={2} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 800, color: '#B0BBC8', padding: '4px 0', letterSpacing: 0.5 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = key(d);
            const meta = dayMeta[k];
            const isToday = isCurrentMonth && d === today;
            const style = meta ? STATUS_STYLE[meta.status] : null;
            const isPast = isCurrentMonth && d < today;

            return (
              <div
                key={k}
                onClick={() => !isPast && setSetStatusFor(setStatusFor === k ? null : k)}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 9,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: isPast ? 'default' : 'pointer',
                  background: style?.bg ?? (isToday ? '#EEF3FB' : '#F7F8FA'),
                  border: isToday ? `2px solid ${ACCENT}` : '1px solid transparent',
                  opacity: isPast ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: isToday ? 800 : 600, color: style?.fg ?? (isToday ? ACCENT : '#15243B') }}>
                  {d}
                </span>
                {meta && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: style!.fg, display: 'block', marginTop: 2 }} />
                )}

                {/* Status picker popover */}
                {setStatusFor === k && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(20,40,80,0.15)',
                      padding: 6, zIndex: 20, minWidth: 130,
                    }}
                  >
                    {(Object.entries(STATUS_STYLE) as [DayStatus, typeof STATUS_STYLE[DayStatus]][]).map(([st, { fg, label }]) => (
                      <button
                        key={st}
                        onClick={() => setStatus(d, st)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '7px 9px', borderRadius: 8,
                          border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 12.5, fontWeight: 700, color: fg,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: fg, display: 'inline-block', flexShrink: 0 }} />
                        {label}
                      </button>
                    ))}
                    {meta && (
                      <button
                        onClick={() => { setDayMeta(prev => { const n = { ...prev }; delete n[k]; return n; }); setSetStatusFor(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#C7553B', borderTop: '1px solid #F0F2F5', marginTop: 4 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nudge — if no availability set */}
      {Object.keys(dayMeta).length === 0 && (
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 14, background: '#FEF3E2', border: '1px solid #F5D99A', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CalendarDays size={20} color={AMBER} strokeWidth={2} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>Mark your availability</div>
            <div style={{ fontSize: 12.5, color: AMBER }}>Tap any date to set its status. Renters see available dates on your listing.</div>
          </div>
        </div>
      )}
    </div>
  );
}
