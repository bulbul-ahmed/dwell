export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ width: 120, height: 22, borderRadius: 6, background: '#ECEEF1', marginBottom: 10 }} />
          <div style={{ width: 260, height: 32, borderRadius: 8, background: '#ECEEF1', marginBottom: 8 }} />
          <div style={{ width: 200, height: 16, borderRadius: 6, background: '#F0F2F5' }} />
        </div>
        <div style={{ width: 130, height: 42, borderRadius: 11, background: '#ECEEF1' }} />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 13, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F0F2F5', flexShrink: 0 }} />
            <div style={{ width: 80, height: 14, borderRadius: 6, background: '#F0F2F5' }} />
          </div>
        ))}
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 14, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: '16px 17px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F0F2F5', marginBottom: 16 }} />
            <div style={{ width: 50, height: 28, borderRadius: 6, background: '#ECEEF1', marginBottom: 8 }} />
            <div style={{ width: 90, height: 13, borderRadius: 5, background: '#F0F2F5', marginBottom: 4 }} />
            <div style={{ width: 70, height: 11, borderRadius: 5, background: '#F5F6F8' }} />
          </div>
        ))}
      </div>

      {/* Chart + visits skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]" style={{ gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '22px 24px' }}>
          <div style={{ width: 180, height: 18, borderRadius: 6, background: '#ECEEF1', marginBottom: 6 }} />
          <div style={{ width: 250, height: 13, borderRadius: 5, background: '#F0F2F5', marginBottom: 22 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 160 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '80%', height: `${20 + Math.sin(i * 0.7) * 40 + 40}%`, borderRadius: '4px 4px 0 0', background: '#F0F2F5' }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '22px 24px' }}>
          <div style={{ width: 130, height: 18, borderRadius: 6, background: '#ECEEF1', marginBottom: 16 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 11, border: '1px solid #ECEEF1', borderRadius: 13, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: '#F0F2F5', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: 13, borderRadius: 5, background: '#ECEEF1', marginBottom: 6 }} />
                <div style={{ width: '80%', height: 11, borderRadius: 5, background: '#F0F2F5' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Listings + activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]" style={{ gap: 18 }}>
        {[3, 4].map((rows, idx) => (
          <div key={idx} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 100, height: 16, borderRadius: 6, background: '#ECEEF1' }} />
              <div style={{ width: 60, height: 14, borderRadius: 5, background: '#F0F2F5' }} />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #ECEEF1', borderRadius: 13, marginBottom: 8 }}>
                <div style={{ width: 50, height: 50, borderRadius: 11, background: '#F0F2F5', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '65%', height: 13, borderRadius: 5, background: '#ECEEF1', marginBottom: 6 }} />
                  <div style={{ width: '45%', height: 11, borderRadius: 5, background: '#F0F2F5' }} />
                </div>
                <div style={{ width: 50, height: 20, borderRadius: 999, background: '#F0F2F5' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
