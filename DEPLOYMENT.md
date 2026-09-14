# Supabase + Vercel 部署说明

## 1. 创建 Supabase 项目

1. 在 Supabase 新建项目。
2. 打开 **SQL Editor**，复制并执行 `supabase/migrations/001_initial.sql`。
3. 打开 **Authentication → Users**，创建一个后台管理员账号，填写邮箱和密码。
4. 从项目顶部的 **Connect** 复制项目 URL 和 publishable key，再到 **Settings → API Keys** 复制 secret key。

secret key 只允许放在 `.env.local` 和 Vercel 的服务器环境变量中，不能发到前端、聊天记录或 Git 仓库。旧项目的 `service_role` 密钥仍可兼容使用。

## 2. 本地连接

复制 `.env.example` 为 `.env.local`，填写：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_EMAILS`：填刚创建的管理员邮箱；多个邮箱用英文逗号分隔。

首次连接后运行：

```powershell
pnpm run migrate:supabase
```

这会把旧后台中的文章、上传图片和答卷备份导入 Supabase。原始备份保存在项目同级的 `supabase-migration-backup` 文件夹。

## 3. 部署到 Vercel

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 导入仓库，框架会自动识别为 Next.js。
3. 在 Vercel 项目 **Settings → Environment Variables** 添加上面四个变量。
4. 确认 Production 环境未启用面向访客的 Deployment Protection，然后重新部署。公开网站为 `/`，问卷为 `/journey`，两者均无需登录；后台入口 `/admin` 需要管理员邮箱和密码。

以后在后台修改文章、图片或问卷，数据直接保存在 Supabase；重新部署不会清空内容。答卷也会进入同一个 Supabase 项目，并可在后台统计页查看或导出 CSV。
