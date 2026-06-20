import Link from 'next/link';

const ACCENT = '#1E3A5C';

const EXPLORE = ['Flats for rent', 'Flats for sale', 'Sublets', 'Student housing'];
const COMPANY = ['About us', 'How it works', 'Trust & safety', 'Careers'];
const OWNERS = ['List a property', 'Agency plans', 'Pricing', 'Owner guide'];

export default function Footer() {
  return (
    <footer style={{ background: '#15243B', color: '#fff', marginTop: 20 }}>
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-12 sm:px-10 sm:pt-14">
        <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:gap-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.5 10v9.5h13V10" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 23 }}>Dwell</span>
            </div>
            <p style={{ fontSize: 14, color: '#9BA3B4', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              The trusted, visually-delightful way to find and list property in Bangladesh — starting in Aftab Nagar.
            </p>
          </div>

          {/* Explore */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Explore</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#9BA3B4' }}>
              {EXPLORE.map(t => <span key={t}>{t}</span>)}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#9BA3B4' }}>
              {COMPANY.map(t => <span key={t}>{t}</span>)}
            </div>
          </div>

          {/* For owners */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>For owners</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#9BA3B4' }}>
              <Link href="/list" style={{ color: '#9BA3B4', textDecoration: 'none', cursor: 'pointer' }}>List a property</Link>
              {OWNERS.slice(1).map(t => <span key={t}>{t}</span>)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[13px] text-[#7A8294] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Dwell · Binary Fusion LLC</span>
          <span style={{ display: 'flex', gap: 22 }}>
            <span>Privacy</span><span>Terms</span><span>Help</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
