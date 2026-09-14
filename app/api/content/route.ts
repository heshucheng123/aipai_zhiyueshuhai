import { defaultSiteContent, isSiteContentDocument } from '@/content/site-content';
import { getAdminAccess } from '@/lib/admin-access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CONTENT_KEY = 'main';

export async function GET() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ content: defaultSiteContent, persistence: 'unconfigured' });

  const { data, error } = await supabase
    .from('site_content')
    .select('content, updated_at')
    .eq('content_key', CONTENT_KEY)
    .maybeSingle();

  if (!error && data && isSiteContentDocument(data.content)) {
    return Response.json({
      content: data.content,
      persistence: 'database',
      updatedAt: data.updated_at ? Date.parse(data.updated_at) : undefined,
    }, { headers: { 'cache-control': 'no-store' } });
  }

  return Response.json({ content: defaultSiteContent, persistence: error ? 'unavailable' : 'default' });
}

export async function PUT(request: Request) {
  const access = await getAdminAccess();
  if (!access.allowed) return Response.json({ error: '请使用管理员邮箱登录。' }, { status: 403 });

  const raw = await request.text();
  if (raw.length > 2_000_000) return Response.json({ error: '内容数据过大。' }, { status: 413 });

  let content: unknown;
  try {
    content = JSON.parse(raw);
  } catch {
    return Response.json({ error: '内容格式不是有效 JSON。' }, { status: 400 });
  }
  if (!isSiteContentDocument(content)) return Response.json({ error: '内容缺少必要栏目。' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: 'Supabase 尚未配置。' }, { status: 503 });

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('site_content').upsert({
    content_key: CONTENT_KEY,
    content,
    updated_at: updatedAt,
    updated_by: access.user?.email ?? 'admin',
  }, { onConflict: 'content_key' });

  if (error) return Response.json({ error: `内容保存失败：${error.message}` }, { status: 503 });
  return Response.json({ ok: true, persistence: 'database', updatedAt: Date.parse(updatedAt) });
}
