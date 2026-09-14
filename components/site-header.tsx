'use client';

import { useSiteContent } from '@/components/site-content-provider';

type PageName = 'home' | 'journey' | 'articles';

export function SiteHeader({ active }: { active: PageName }) {
  const { siteIdentity } = useSiteContent();
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="返回首页">
        <img src={siteIdentity.logo} alt="" />
        <span className="brand-copy">
          <strong>{siteIdentity.name}</strong>
          <small>{siteIdentity.teamName}</small>
        </span>
      </a>
      <nav aria-label="主导航">
        <a href="/" aria-current={active === 'home' ? 'page' : undefined}>首页</a>
        <a href="/journey" aria-current={active === 'journey' ? 'page' : undefined}>回忆之旅</a>
        <a href="/articles" aria-current={active === 'articles' ? 'page' : undefined}>实践记录</a>
      </nav>
    </header>
  );
}
