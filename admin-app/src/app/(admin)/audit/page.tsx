import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';

type ActionKind = 'Approved' | 'Rejected' | 'Updated' | 'Flagged' | 'Message';

interface AuditRow {
  avatarInitials: string;
  avatarGrad: string;
  name: string;
  action: ActionKind;
  actionText: string;
  target: string;
  time: string;
}

const ACTION_TAG: Record<ActionKind, { bg: string; fg: string }> = {
  Approved: { bg: '#E7F1EC', fg: '#2E7D55' },
  Rejected:  { bg: '#F8E8E3', fg: '#B4402B' },
  Updated:   { bg: '#F7EFDD', fg: '#9A6A1F' },
  Flagged:   { bg: '#F7EFDD', fg: '#9A6A1F' },
  Message:   { bg: '#EEF3F8', fg: '#1E3A5C' },
};

// Gradient palettes for avatars
const AVAT_GRAD: Record<string, string> = {
  SA: 'linear-gradient(140deg, #1E3A5C, #2C557F)',
  MA: 'linear-gradient(140deg, #2E7D55, #1E5C3F)',
  RA: 'linear-gradient(140deg, #9A6A1F, #C9A24B)',
};

const ROWS: AuditRow[] = [
  {
    avatarInitials: 'SA', avatarGrad: AVAT_GRAD.SA, name: 'Shamim Ahsan',
    action: 'Approved', actionText: 'Approved listing',
    target: 'Cozy 1-Bed near the Lake', time: '2 min ago',
  },
  {
    avatarInitials: 'SA', avatarGrad: AVAT_GRAD.SA, name: 'Shamim Ahsan',
    action: 'Rejected', actionText: 'Rejected listing',
    target: 'Luxury penthouse – fake images', time: '14 min ago',
  },
  {
    avatarInitials: 'MA', avatarGrad: AVAT_GRAD.MA, name: 'Maliha Ahmed',
    action: 'Flagged', actionText: 'Flagged user',
    target: 'User: bulbulishere@gmail.com', time: '1h ago',
  },
  {
    avatarInitials: 'SA', avatarGrad: AVAT_GRAD.SA, name: 'Shamim Ahsan',
    action: 'Approved', actionText: 'Approved listing',
    target: 'Spacious 3-Bed Family Flat', time: '3h ago',
  },
  {
    avatarInitials: 'RA', avatarGrad: AVAT_GRAD.RA, name: 'Rafiul Alam',
    action: 'Updated', actionText: 'Updated config',
    target: 'Area: Block C pricing', time: '5h ago',
  },
  {
    avatarInitials: 'SA', avatarGrad: AVAT_GRAD.SA, name: 'Shamim Ahsan',
    action: 'Approved', actionText: 'Approved listing',
    target: 'Premium 3-Bed with Rooftop', time: 'Yesterday, 4:12 PM',
  },
  {
    avatarInitials: 'MA', avatarGrad: AVAT_GRAD.MA, name: 'Maliha Ahmed',
    action: 'Message', actionText: 'Sent notice',
    target: 'Sent notice to owner: Kamal Hossain', time: 'Yesterday, 2:30 PM',
  },
  {
    avatarInitials: 'RA', avatarGrad: AVAT_GRAD.RA, name: 'Rafiul Alam',
    action: 'Rejected', actionText: 'Rejected listing',
    target: 'Student room – missing photos', time: '2 days ago',
  },
];

export default async function AuditPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const adminInitials = initials(session.name);

  return (
    <>
      <Topbar
        crumb="System"
        title="Audit log"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1px solid #ECEEF1',
              borderRadius: 10, padding: '0 14px', height: 38,
              flex: '0 0 260px',
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#9AA6B6" strokeWidth="1.6"/>
                <path d="M11 11L14 14" stroke="#9AA6B6" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search audit log…"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'inherit', fontSize: 13.5, color: '#15243B',
                  fontWeight: 500, flex: 1, minWidth: 0,
                }}
              />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#fff', border: '1px solid #ECEEF1',
              borderRadius: 10, padding: '0 14px', height: 38,
              fontSize: 13.5, fontWeight: 600, color: '#8893A4', cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2.5" width="12" height="10" rx="2" stroke="#9AA6B6" strokeWidth="1.5"/>
                <path d="M4 1v3M10 1v3" stroke="#9AA6B6" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M1 6h12" stroke="#9AA6B6" strokeWidth="1.5"/>
              </svg>
              All dates
            </div>
          </div>

          {/* Table card */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1',
            borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr 1.4fr 1fr',
              background: '#FAFBFC',
              borderBottom: '1px solid #ECEEF1',
              padding: '11px 22px',
            }}>
              {['Admin', 'Action', 'Target', 'Timestamp'].map(col => (
                <span key={col} style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '.07em',
                  textTransform: 'uppercase' as const, color: '#9AA6B6',
                }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => {
              const tag = ACTION_TAG[row.action];
              return (
                <div
                  key={i}
                  className="bv-rowh"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 1.4fr 1fr',
                    padding: '13px 22px',
                    alignItems: 'center',
                    borderBottom: i < ROWS.length - 1 ? '1px solid #F4F6F9' : 'none',
                  }}
                >
                  {/* Admin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: row.avatarGrad,
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10.5, fontWeight: 800, letterSpacing: 0.2,
                    }}>
                      {row.avatarInitials}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>
                      {row.name}
                    </span>
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{
                      padding: '3px 9px', borderRadius: 999,
                      background: tag.bg, color: tag.fg,
                      fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' as const,
                    }}>
                      {row.action}
                    </span>
                    <span style={{ fontSize: 13.5, color: '#44506A', fontWeight: 500 }}>
                      {row.actionText}
                    </span>
                  </div>

                  {/* Target */}
                  <span style={{
                    fontSize: 13.5, fontWeight: 700, color: '#1E3A5C',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                    paddingRight: 12,
                  }}>
                    {row.target}
                  </span>

                  {/* Timestamp */}
                  <span style={{
                    fontSize: 12.5, color: '#9AA6B6', fontWeight: 500, textAlign: 'right' as const,
                  }}>
                    {row.time}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </>
  );
}
