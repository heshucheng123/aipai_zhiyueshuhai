'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { articleCategories } from '@/content/site-content';
import { useSiteContent } from '@/components/site-content-provider';

export default function ArticlesPage() {
  const { articles } = useSiteContent();
  const [category, setCategory] = useState<string>(articleCategories[0]);
  const visible = category === '全部文章' ? articles : articles.filter((article) => article.category === category);
  return (
    <div className="site-shell">
      <SiteHeader active="articles" />
      <main className="articles-page section-frame">
        <header className="archive-header">
          <p className="section-kicker">项目档案</p>
          <h1>实践记录</h1>
          <p>新闻、项目进展和成员感悟都汇总在这里。</p>
        </header>
        <div className="archive-layout">
          <aside className="category-nav" aria-label="文章分类">
            {articleCategories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
          </aside>
          <section className="article-grid" aria-label={category}>
            {visible.map((article) => (
              <a className="article-card" href={`/articles/${article.slug}`} key={article.slug}>
                <img src={article.image} alt="" />
                <div>
                  <span>{article.category}　{article.date}</span>
                  <h2>{article.title}</h2>
                  <p>{article.summary}</p>
                  <b>阅读全文 <ArrowRight aria-hidden="true" /></b>
                </div>
              </a>
            ))}
          </section>
        </div>
      </main>
      <footer className="site-footer section-frame"><span>数字教学资源创新实践团队</span><span>内容持续完善中</span></footer>
    </div>
  );
}
