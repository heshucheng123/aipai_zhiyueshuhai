import { AdminEditor } from '@/components/admin-editor';
import { getAdminAccess } from '@/lib/admin-access';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (!access.user) redirect('/admin/login');

  if (!access.allowed) {
    return (
      <main className="admin-locked">
        <div>
          <p>智跃书海 · 内容后台</p>
          <h1>当前账号没有编辑权限</h1>
          <p>请将 {access.user.email ?? '当前邮箱'} 加入 Vercel 环境变量 ADMIN_EMAILS。</p>
          <div className="admin-locked-actions"><a href="/">返回网站</a><form action="/api/admin/logout" method="post"><button type="submit">退出登录</button></form></div>
        </div>
      </main>
    );
  }

  return <AdminEditor editorName={access.user.email ?? '管理员'} />;
}
