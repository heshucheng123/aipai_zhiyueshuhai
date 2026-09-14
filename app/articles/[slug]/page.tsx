'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { RichText } from '@/components/rich-text';
import { SiteHeader } from '@/components/site-header';
import { useSiteContent } from '@/components/site-content-provider';

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const { articles } = useSiteContent();
  const article = articles.find((item) => item.slug === params.slug);

  if (!article) {
    return (
      <div className="site-shell">
        <SiteHeader active="articles" />
        <main className="article-page section-frame">
          <a className="back-link" href="/articles"><ArrowLeft aria-hidden="true" /> 返回实践记录</a>
          <header><h1>文章尚未添加</h1><p className="article-lead">请检查文章地址，或在内容后台添加这篇文章。</p></header>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <SiteHeader active="articles" />
      <main className="article-page section-frame">
        <a className="back-link" href="/articles"><ArrowLeft aria-hidden="true" /> 返回实践记录</a>
        <header>
          <p className="section-kicker">{article.category}　{article.date}</p>
          <h1>{article.title}</h1>
          <p className="article-lead">{article.lead}</p>
        </header>
        <figure className="article-hero"><img src={article.image} alt={article.imageAlt} /><figcaption>{article.heroCaption}</figcaption></figure>
        <article className="article-body">
          {article.blocks.map((block, index) => block.type === 'section' ? (
            <section key={`${block.heading}-${index}`}>
              <h2>{block.heading}</h2>
              <RichText paragraphs={block.paragraphs} />
            </section>
          ) : (
            <figure key={`${block.src}-${index}`}><img src={block.src} alt={block.alt} /><figcaption>{block.caption}</figcaption></figure>
          ))}
        </article>
      </main>
      <footer className="site-footer section-frame"><span>数字教学资源创新实践团队</span><span>内容持续完善中</span></footer>
    </div>
  );
}
