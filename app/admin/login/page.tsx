import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { getAdminAccess } from '@/lib/admin-access';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.allowed) redirect('/admin');
  return <AdminLoginForm configured={access.configured} />;
}
