import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bdFormat(n: number): string {
  const s = String(Math.round(n));
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (rest ? rest + ',' : '') + last3;
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const BADGE_MAP: Record<string, [string, string]> = {
  Active:     ['#2E7D55', '#E7F1EC'],
  Approved:   ['#2E7D55', '#E7F1EC'],
  Verified:   ['#2E7D55', '#E7F1EC'],
  Resolved:   ['#2E7D55', '#E7F1EC'],
  Pending:    ['#9A6A1F', '#F7EFDD'],
  'In review':['#9A6A1F', '#F7EFDD'],
  Open:       ['#9A6A1F', '#F7EFDD'],
  Unverified: ['#9A6A1F', '#F7EFDD'],
  Rejected:   ['#B4402B', '#F8E8E3'],
  Banned:     ['#B4402B', '#F8E8E3'],
  Flagged:    ['#B4402B', '#F8E8E3'],
  Suspended:  ['#6B5410', '#F4ECD6'],
  Paused:     ['#5A6172', '#EEF0F3'],
  Draft:      ['#5A6172', '#EEF0F3'],
  Rented:     ['#2A5C8A', '#E6EFF7'],
  Featured:   ['#9A7B1F', '#F6EFD9'],
};

export function badge(status: string) {
  const [fg, bg] = BADGE_MAP[status] ?? ['#5A6172', '#EEF0F3'];
  return { fg, bg };
}
