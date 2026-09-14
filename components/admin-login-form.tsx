'use client';

import { useState } from 'react';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase 环境变量尚未配置。');
      return;
    }

    setSubmitting(true);
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message === 'Invalid login credentials' ? '邮箱或密码不正确。' : result.error.message);
      return;
    }
    router.replace('/admin');
    router.refresh();
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <a className="admin-login-brand" href="/"><span>智跃书海</span><small>内容管理后台</small></a>
        <div className="admin-login-heading">
          <LockKeyhole aria-hidden="true" />
          <p>ADMIN ACCESS</p>
          <h1>登录后台</h1>
          <span>使用 Supabase 中创建的管理员邮箱和密码。</span>
        </div>
        <form onSubmit={signIn}>
          <label><span>邮箱</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label><span>密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="admin-login-error">{error}</p>}
          {!configured && <p className="admin-login-error">项目尚未连接 Supabase，请先填写 .env.local。</p>}
          <button type="submit" disabled={submitting || !configured}>
            {submitting && <LoaderCircle className="is-spinning" aria-hidden="true" />}
            {submitting ? '正在登录' : '登录'}
          </button>
        </form>
        <a className="admin-login-back" href="/">返回网站</a>
      </section>
    </main>
  );
}
