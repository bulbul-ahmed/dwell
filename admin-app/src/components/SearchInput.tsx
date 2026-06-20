'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search } from 'lucide-react';

interface Props {
  placeholder?: string;
  paramKey?: string;
}

export default function SearchInput({ placeholder = 'Search…', paramKey = 'q' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value.trim();
    if (val) {
      params.set(paramKey, val);
    } else {
      params.delete(paramKey);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams, paramKey]);

  const current = searchParams.get(paramKey) ?? '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      height: 40, padding: '0 13px', borderRadius: 11,
      background: '#fff', border: '1px solid #E2E7EE',
      width: 280, boxShadow: '0 1px 3px rgba(20,40,70,.04)',
      opacity: isPending ? 0.7 : 1, transition: 'opacity .15s',
    }}>
      <Search size={15} color="#9AA6B6" strokeWidth={2} style={{ flexShrink: 0 }} />
      <input
        defaultValue={current}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'inherit', fontSize: 13.5, color: '#15243B', width: '100%',
        }}
      />
      {isPending && (
        <div style={{
          width: 14, height: 14, border: '2px solid #E2E7EE',
          borderTopColor: '#1E3A5C', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite', flexShrink: 0,
        }} />
      )}
    </div>
  );
}
