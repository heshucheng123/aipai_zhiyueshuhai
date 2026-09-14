import { createSupabaseServerClient } from '@/lib/supabase/server';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminAccess() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { allowed: false, configured: false, user: null };

  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  const allowlist = adminEmails();
  const email = user?.email?.toLowerCase();
  const allowed = Boolean(email && allowlist.includes(email));
  return { allowed, configured: true, user };
}
