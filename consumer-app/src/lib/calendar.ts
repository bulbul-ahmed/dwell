// Client-only calendar helpers for confirmed visits.
// Builds a Google Calendar link and a downloadable .ics (Apple/Outlook).

const pad = (n: number) => String(n).padStart(2, '0');
const fmtLocal = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const fmtDateOnly = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

// Parse visitDate ('YYYY-MM-DD') + visitTime ('3:00 PM' | '15:00' | null).
function parseVisit(date: string, time: string | null): { start: Date; allDay: boolean } | null {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  if (!time) return { start: new Date(y, m - 1, d), allDay: true };
  const mt = time.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!mt) return { start: new Date(y, m - 1, d), allDay: true };
  let h = parseInt(mt[1], 10);
  const min = parseInt(mt[2], 10);
  const ap = mt[3]?.toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return { start: new Date(y, m - 1, d, h, min), allDay: false };
}

const DURATION_MIN = 60;

export function buildGoogleUrl(title: string, location: string, date: string, time: string | null): string | null {
  const p = parseVisit(date, time);
  if (!p) return null;
  let dates: string;
  if (p.allDay) {
    const end = new Date(p.start);
    end.setDate(end.getDate() + 1);
    dates = `${fmtDateOnly(p.start)}/${fmtDateOnly(end)}`;
  } else {
    const end = new Date(p.start.getTime() + DURATION_MIN * 60000);
    dates = `${fmtLocal(p.start)}/${fmtLocal(end)}`;
  }
  const u = new URL('https://calendar.google.com/calendar/render');
  u.searchParams.set('action', 'TEMPLATE');
  u.searchParams.set('text', title);
  u.searchParams.set('dates', dates);
  if (location) u.searchParams.set('location', location);
  u.searchParams.set('details', 'Property visit scheduled via Dwell.');
  return u.toString();
}

export function buildICS(id: number, title: string, location: string, date: string, time: string | null): string | null {
  const p = parseVisit(date, time);
  if (!p) return null;
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const dt = p.allDay
    ? `DTSTART;VALUE=DATE:${fmtDateOnly(p.start)}`
    : `DTSTART:${fmtLocal(p.start)}\r\nDTEND:${fmtLocal(new Date(p.start.getTime() + DURATION_MIN * 60000))}`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dwell//Visits//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:dwell-visit-${id}@dwell.bd`,
    `SUMMARY:${esc(title)}`,
    location ? `LOCATION:${esc(location)}` : '',
    'DESCRIPTION:Property visit scheduled via Dwell.',
    dt,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Dwell visit reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
