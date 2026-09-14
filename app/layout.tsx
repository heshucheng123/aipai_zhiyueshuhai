import type { Metadata } from 'next';
import { SiteContentProvider } from '@/components/site-content-provider';
import './globals.css';

export const metadata: Metadata = {
  title: '智跃书海｜基于大模型的数字教学资源创新实践团队',
  description: '记录教育出版调研，探索教辅的数字化表达与使用。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><SiteContentProvider>{children}</SiteContentProvider></body>
    </html>
  );
}
