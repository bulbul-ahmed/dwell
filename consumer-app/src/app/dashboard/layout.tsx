import { redirect } from 'next/navigation';
import { getProviderSession } from '@/lib/auth';
import DashboardShell from '@/components/provider/DashboardShell';

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard');

  return (
    <DashboardShell
      ownerName={session.ownerName}
      ownerType={session.ownerType}
      ownerStatus={session.ownerStatus}
      avatarUrl={session.avatarUrl}
    >
      {children}
    </DashboardShell>
  );
}
