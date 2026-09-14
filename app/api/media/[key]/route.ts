import { createSupabaseAdminClient, MEDIA_BUCKET } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return new Response('Media storage unavailable', { status: 503 });
  const { key } = await params;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);
  return Response.redirect(data.publicUrl, 307);
}
