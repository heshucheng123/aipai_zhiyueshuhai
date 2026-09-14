import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerConfig } from '@/lib/supabase/config';

export const MEDIA_BUCKET = 'site-media';

export function createSupabaseAdminClient() {
  const config = getSupabaseServerConfig();
  if (!config) return null;

  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
