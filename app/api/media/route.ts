import { getAdminAccess } from '@/lib/admin-access';
import { createSupabaseAdminClient, MEDIA_BUCKET } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (!access.allowed) return Response.json({ error: '请使用管理员邮箱登录。' }, { status: 403 });

  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > 9 * 1024 * 1024) {
    return Response.json({ error: '单张图片不能超过 8MB。' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: '图片上传数据无法读取，请重新选择文件。' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return Response.json({ error: '请选择图片文件。' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: '仅支持 JPG、PNG、WebP 或 GIF。' }, { status: 415 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: '单张图片不能超过 8MB。' }, { status: 413 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: 'Supabase 图片存储尚未配置。' }, { status: 503 });

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const objectKey = `asset-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(objectKey, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (uploadError) return Response.json({ error: `图片上传失败：${uploadError.message}` }, { status: 503 });

  const { error: metadataError } = await supabase.from('media_assets').insert({
    object_key: objectKey,
    file_name: file.name,
    mime_type: file.type,
    size: file.size,
    created_by: access.user?.email ?? 'admin',
  });
  if (metadataError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([objectKey]);
    return Response.json({ error: `图片记录保存失败：${metadataError.message}` }, { status: 503 });
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectKey);
  return Response.json({ ok: true, url: data.publicUrl, fileName: file.name });
}
