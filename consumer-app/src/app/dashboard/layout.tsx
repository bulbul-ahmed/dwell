import { redirect } from 'next/navigation';
import { getProviderSession } from '@/lib/auth';
import Sidebar from '@/components/provider/Sidebar';
import Header from '@/components/provider/Header';
import Toast from '@/components/provider/Toast';
import OwnerVerifyBanner from '@/components/provider/OwnerVerifyBanner';

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F9' }}>
      <Sidebar ownerName={session.ownerName} ownerType={session.ownerType} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <OwnerVerifyBanner status={session.ownerStatus} />
        <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
