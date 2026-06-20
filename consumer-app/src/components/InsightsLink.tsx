'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ACCENT = '#1E3A5C';

export default function InsightsLink() {
  const pathname = usePathname();
  return (
    <Link
      href="/insights"
      style={{
        fontSize: 14.5,
        fontWeight: 500,
        color: pathname === '/insights' ? ACCENT : '#41495A',
        textDecoration: 'none',
      }}
    >
      Insights
    </Link>
  );
}
