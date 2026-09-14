import { getAdminAccess } from '@/lib/admin-access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type SubmissionInput = {
  submissionId?: unknown;
  answers?: unknown;
  questions?: unknown;
  note?: unknown;
};

type StoredResponse = {
  id: string;
  role: string;
  answers: unknown;
  questions: unknown;
  note: string | null;
  submitted_at: string;
};

const SUBMISSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE_ORDER = ['大学生', '初高中教师', '初高中家长', '初高中学生'];

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 64_000) return Response.json({ error: '答卷数据过大。' }, { status: 413 });

  let input: SubmissionInput;
  try {
    input = JSON.parse(raw) as SubmissionInput;
  } catch {
    return Response.json({ error: '答卷格式不正确。' }, { status: 400 });
  }

  const submissionId = typeof input.submissionId === 'string' ? input.submissionId : '';
  const answers = stringArray(input.answers);
  const questions = stringArray(input.questions);
  const note = typeof input.note === 'string' ? input.note.trim() : '';

  if (!SUBMISSION_ID_PATTERN.test(submissionId)) return Response.json({ error: '答卷编号无效，请重新开始问卷。' }, { status: 400 });
  if (answers.length !== 8 || questions.length !== 8 || answers.some((answer) => !answer.trim() || answer.length > 500)) {
    return Response.json({ error: '请完成全部八道题后再提交。' }, { status: 400 });
  }
  if (questions.some((question) => !question.trim() || question.length > 500)) return Response.json({ error: '问卷题目数据无效。' }, { status: 400 });
  if (note.length > 2_000) return Response.json({ error: '补充建议不能超过 2000 字。' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: '答卷数据库尚未配置，请稍后再试。' }, { status: 503 });

  const submittedAt = new Date().toISOString();
  const { error } = await supabase.from('survey_responses').upsert({
    id: submissionId,
    role: answers[0].trim(),
    answers,
    questions,
    note,
    submitted_at: submittedAt,
  }, { onConflict: 'id' });
  if (error) return Response.json({ error: `答卷提交失败：${error.message}` }, { status: 503 });

  return Response.json({ ok: true, submissionId, submittedAt: Date.parse(submittedAt) });
}

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (!access.allowed) return Response.json({ error: '请使用管理员邮箱登录。' }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: '答卷数据库尚未配置。' }, { status: 503 });

  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, role, answers, questions, note, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(20_000);
  if (error) return Response.json({ error: `答卷读取失败：${error.message}` }, { status: 503 });

  const parsedRows = ((data ?? []) as StoredResponse[]).map((row) => ({
    id: row.id,
    role: row.role,
    answers: stringArray(row.answers),
    questions: stringArray(row.questions),
    note: row.note ?? '',
    submittedAt: Date.parse(row.submitted_at),
  }));

  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const header = ['提交时间', '答卷编号', '身份', ...Array.from({ length: 8 }, (_, index) => `第${index + 1}题`), '补充建议'];
    const lines = parsedRows.map((row) => [
      new Date(row.submittedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      row.id,
      row.role,
      ...Array.from({ length: 8 }, (_, index) => row.answers[index] ?? ''),
      row.note,
    ]);
    const csv = `\ufeff${[header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n')}`;
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="survey-responses-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const roleCounts = new Map<string, number>();
  const questionStats = Array.from({ length: 8 }, (_, index) => ({ index, title: '', counts: new Map<string, number>(), total: 0 }));
  for (const row of parsedRows) {
    roleCounts.set(row.role, (roleCounts.get(row.role) ?? 0) + 1);
    for (let index = 0; index < questionStats.length; index += 1) {
      const answer = row.answers[index];
      if (!answer) continue;
      const stat = questionStats[index];
      if (!stat.title && row.questions[index]) stat.title = row.questions[index];
      stat.counts.set(answer, (stat.counts.get(answer) ?? 0) + 1);
      stat.total += 1;
    }
  }

  const orderedRoles = [...ROLE_ORDER, ...Array.from(roleCounts.keys()).filter((role) => !ROLE_ORDER.includes(role))];
  return Response.json({
    totalResponses: parsedRows.length,
    roles: orderedRoles.map((role) => ({ role, count: roleCounts.get(role) ?? 0 })),
    questions: questionStats.map((stat) => ({
      index: stat.index,
      title: stat.title || `第 ${stat.index + 1} 题`,
      total: stat.total,
      options: Array.from(stat.counts.entries())
        .map(([option, count]) => ({ option, count, percentage: stat.total ? Math.round((count / stat.total) * 1000) / 10 : 0 }))
        .sort((left, right) => right.count - left.count),
    })),
    recent: parsedRows.slice(0, 12).map((row) => ({ id: row.id, role: row.role, note: row.note, submittedAt: row.submittedAt })),
  }, { headers: { 'cache-control': 'no-store' } });
}
