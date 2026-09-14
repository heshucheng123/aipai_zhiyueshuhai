'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, LoaderCircle, MessageSquareText, RefreshCw } from 'lucide-react';

type SurveyData = {
  totalResponses: number;
  roles: Array<{ role: string; count: number }>;
  questions: Array<{
    index: number;
    title: string;
    total: number;
    options: Array<{ option: string; count: number; percentage: number }>;
  }>;
  recent: Array<{ id: string; role: string; note: string; submittedAt: number }>;
};

export function SurveyDashboard() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/survey-responses', { cache: 'no-store' });
      const payload = await response.json() as SurveyData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? '读取答卷失败');
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '读取答卷失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) {
    return <div className="admin-survey-state"><LoaderCircle className="is-spinning" aria-hidden="true" /><span>正在读取答卷数据…</span></div>;
  }
  if (error && !data) {
    return <div className="admin-survey-state error"><span>{error}</span><button type="button" className="admin-secondary" onClick={() => void load()}>重新读取</button></div>;
  }
  if (!data) return null;

  return (
    <div className="admin-content-stack admin-survey-dashboard">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><p>Responses</p><h2>答卷概览</h2></div>
          <div className="admin-survey-actions">
            <button type="button" className="admin-secondary" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'is-spinning' : ''} aria-hidden="true" /> 刷新</button>
            <a className="admin-secondary" href="/api/survey-responses?format=csv"><Download aria-hidden="true" /> 导出 CSV</a>
          </div>
        </div>
        {error && <p className="admin-inline-error">{error}</p>}
        <div className="admin-survey-overview">
          <div className="admin-survey-total"><BarChart3 aria-hidden="true" /><span>有效答卷</span><strong>{data.totalResponses}</strong><small>份</small></div>
          <div className="admin-role-grid">
            {data.roles.map((item) => <div key={item.role}><span>{item.role}</span><strong>{item.count}</strong><small>{data.totalResponses ? `${Math.round((item.count / data.totalResponses) * 100)}%` : '0%'}</small></div>)}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p>Statistics</p><h2>逐题统计</h2></div></div>
        {data.totalResponses === 0 ? (
          <div className="admin-survey-empty"><BarChart3 aria-hidden="true" /><h3>还没有收到答卷</h3><p>用户在“回忆之旅”完成并提交后，统计会显示在这里。</p></div>
        ) : (
          <div className="admin-question-stats">
            {data.questions.map((question) => (
              <article key={question.index}>
                <header><span>{String(question.index + 1).padStart(2, '0')}</span><div><h3>{question.title}</h3><small>{question.total} 人回答</small></div></header>
                <div className="admin-option-stats">
                  {question.options.map((option) => (
                    <div className="admin-option-stat" key={option.option}>
                      <div><span>{option.option}</span><b>{option.count} 人 · {option.percentage}%</b></div>
                      <div className="admin-stat-track"><span style={{ width: `${option.percentage}%` }} /></div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p>Recent</p><h2>最近提交</h2></div></div>
        {data.recent.length === 0 ? <p className="admin-muted-copy">暂无提交记录。</p> : (
          <div className="admin-response-table-wrap"><table className="admin-response-table">
            <thead><tr><th>提交时间</th><th>身份</th><th>补充建议</th><th>匿名编号</th></tr></thead>
            <tbody>{data.recent.map((item) => <tr key={item.id}>
              <td>{new Date(item.submittedAt).toLocaleString('zh-CN')}</td><td>{item.role}</td>
              <td>{item.note ? <span className="admin-note-cell"><MessageSquareText aria-hidden="true" />{item.note}</span> : '—'}</td><td><code>{item.id.slice(0, 8)}</code></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
