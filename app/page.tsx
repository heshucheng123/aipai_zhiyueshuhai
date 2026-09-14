'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, MoveUpRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useSiteContent } from '@/components/site-content-provider';

export default function Home() {
  const { homeNews, homeStories, publicationCards } = useSiteContent();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const updateActive = () => setActive(carouselApi.selectedScrollSnap());
    updateActive();
    carouselApi.on('select', updateActive);
    const timer = window.setInterval(() => carouselApi.scrollNext(), 6500);
    return () => {
      window.clearInterval(timer);
      carouselApi.off('select', updateActive);
    };
  }, [carouselApi]);

  return (
    <div className="site-shell">
      <SiteHeader active="home" />
      <main>
        <section className="hero section-frame" aria-label="实践活动精选">
          <Carousel
            className="story-carousel"
            opts={{ align: 'center', loop: true, duration: 38 }}
            setApi={setCarouselApi}
            aria-label="实践活动"
          >
            <CarouselContent className="story-track">
              {homeStories.map((story, index) => (
                <CarouselItem className="story-item" key={story.title}>
                  <a className={`story-card ${active === index ? 'is-active' : ''}`} href={story.href}>
                    <img src={story.image} alt={story.title} />
                    <span className="story-caption">
                      <strong>{story.title}</strong>
                      <small>{story.note}</small>
                    </span>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="story-control story-previous" aria-label="上一张照片" />
            <CarouselNext className="story-control story-next" aria-label="下一张照片" />
          </Carousel>

          <div className="carousel-dots" aria-label="选择活动照片">
            {homeStories.map((story, index) => (
              <button key={story.title} type="button" onClick={() => carouselApi?.scrollTo(index)} aria-label={`显示：${story.title}`} aria-current={active === index} />
            ))}
          </div>
        </section>

        <section className="home-grid section-frame">
          <div className="memory-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">熟悉的一页</p>
                <h2>这些教辅，你还记得吗？</h2>
              </div>
              <a className="icon-link" href="/journey" aria-label="开启回忆之旅">
                <MoveUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="book-grid">
              {publicationCards.map((book, index) => (
                <div className={`book-slot slot-${index + 1}`} key={book.label} tabIndex={0}>
                  <div className="book-inner">
                    <div className={`book-face book-front ${book.image ? 'has-cover' : ''}`}>
                      {book.image ? <img className="book-cover-image" src={book.image} alt={book.imageAlt || book.title} /> : <><span>{book.label}</span><b>封面<br />待补充</b></>}
                    </div>
                    <div className="book-face book-back"><span>名称</span><b>{book.title}</b></div>
                  </div>
                </div>
              ))}
            </div>
            <a className="text-link" href="/journey">开启回忆之旅 <ArrowRight aria-hidden="true" /></a>
          </div>

          <div className="news-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">近期记录</p>
                <h2>新闻动态</h2>
              </div>
              <a className="icon-link" href="/articles" aria-label="查看全部文章"><MoveUpRight aria-hidden="true" /></a>
            </div>
            <div className="news-list">
              {homeNews.map((item) => (
                <a href={item.href} key={item.title}>
                  <time>{item.date}</time>
                  <span>{item.title}</span>
                  <ArrowRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="about section-frame" aria-labelledby="about-title">
          <div className="about-title">
            <p className="section-kicker">关于我们</p>
            <h2 id="about-title">从真实出版现场出发</h2>
          </div>
          <div className="about-copy">
            <p>我们是山东财经大学基于大模型的数字教学资源创新实践团队。通过出版社走访、业务访谈和用户体验调研，探索教辅内容在数字环境中的生产与使用方式。</p>
            <p className="placeholder-note">此处可继续补充 AI-PAI 项目依据、合作单位、团队成员与研究目标。</p>
          </div>
        </section>
      </main>
      <footer className="site-footer section-frame"><span>数字教学资源创新实践团队</span><span>内容持续完善中</span></footer>
    </div>
  );
}
