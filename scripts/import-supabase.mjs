import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('请先在 .env.local 中填写 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SECRET_KEY。');
}

const backupRoot = path.resolve(process.argv[2] ?? '../supabase-migration-backup');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function readJson(fileName) {
  const raw = await fs.readFile(path.join(backupRoot, fileName), 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

const contentBackup = await readJson('site-content.json');
const content = contentBackup.content ?? contentBackup;
const contentResult = await supabase.from('site_content').upsert({
  content_key: 'main',
  content,
  updated_at: new Date().toISOString(),
  updated_by: 'local-migration',
}, { onConflict: 'content_key' });
if (contentResult.error) throw contentResult.error;
console.log('已导入网站内容。');

const mediaAssets = await readJson('media-assets.json').catch(() => []);
for (const asset of mediaAssets) {
  const filePath = path.join(backupRoot, 'media', asset.objectKey);
  const body = await fs.readFile(filePath);
  const upload = await supabase.storage.from('site-media').upload(asset.objectKey, body, {
    contentType: asset.mimeType,
    cacheControl: '31536000',
    upsert: true,
  });
  if (upload.error) throw upload.error;
  const metadata = await supabase.from('media_assets').upsert({
    object_key: asset.objectKey,
    file_name: asset.fileName,
    mime_type: asset.mimeType,
    size: asset.size,
    created_by: 'local-migration',
  }, { onConflict: 'object_key' });
  if (metadata.error) throw metadata.error;
}
console.log(`已导入 ${mediaAssets.length} 张后台图片。`);

const legacyResponses = await readJson('survey-responses.json').catch(() => []);
if (legacyResponses.length) {
  const rows = legacyResponses.map((row) => ({
    id: row.id,
    role: row.role,
    answers: JSON.parse(row.answers_json),
    questions: JSON.parse(row.questions_json),
    note: row.note ?? '',
    submitted_at: new Date(row.submitted_at).toISOString(),
  }));
  const result = await supabase.from('survey_responses').upsert(rows, { onConflict: 'id' });
  if (result.error) throw result.error;
}
console.log(`已导入 ${legacyResponses.length} 份答卷。`);
console.log('Supabase 数据迁移完成。');
