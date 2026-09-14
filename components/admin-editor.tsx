'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download, FileJson, ImagePlus, LoaderCircle, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { RichTextEditor } from '@/components/rich-text-editor';
import { SurveyDashboard } from '@/components/survey-dashboard';
import {
  defaultSiteContent,
  isSiteContentDocument,
  type Article,
  type ArticleBlock,
  type SiteContentDocument,
} from '@/content/site-content';

type AdminSection = 'home' | 'articles' | 'journey' | 'responses';
type Status = { tone: 'idle' | 'saving' | 'success' | 'error'; message: string };

const roles = ['大学生', '初高中教师', '初高中家长', '初高中学生'];
const sectionTitles: Record<AdminSection, string> = { home: '首页内容', articles: '文章管理', journey: '问卷设置', responses: '答卷数据' };
const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 700 * 1024;

async function optimizeImageForUpload(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('原图不能超过 25MB，请先缩小图片后再上传。');
  }
  if (file.size <= TARGET_UPLOAD_BYTES) return file;
  if (file.type === 'image/gif') {
    throw new Error('动态 GIF 不能自动压缩，请上传小于 700KB 的 GIF，或改用 JPG、PNG、WebP。');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('无法读取这张图片，请换用 JPG、PNG 或 WebP 文件。');
  }

  try {
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const initialScale = Math.min(1, 2200 / longestEdge);

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const scale = initialScale * (0.82 ** attempt);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('浏览器无法处理这张图片。');
      context.drawImage(bitmap, 0, 0, width, height);

      const quality = Math.max(0.52, 0.86 - attempt * 0.06);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= TARGET_UPLOAD_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, '-');
        return new File([blob], `${baseName || 'image'}.webp`, { type: 'image/webp', lastModified: file.lastModified });
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error('图片压缩后仍然过大，请换一张尺寸较小的图片。');
}

async function readUploadResponse(response: Response): Promise<{ url?: string; error?: string }> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as { url?: string; error?: string };
  } catch {
    if (response.status === 413 || raw.includes('Payload Too Large')) {
      return { error: '图片体积超过上传限制，请换一张较小的图片。' };
    }
    return { error: raw.trim() || '上传服务暂时无法响应，请稍后重试。' };
  }
}

function cloneContent(content: SiteContentDocument): SiteContentDocument {
  return structuredClone(content);
}

function TextField({ label, value, onChange, multiline = false, hint }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline
        ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
        : <input value={value} onChange={(event) => onChange(event.target.value)} />}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const preparedFile = await optimizeImageForUpload(file);
      const body = new FormData();
      body.append('file', preparedFile);
      const response = await fetch('/api/media', { method: 'POST', body });
      const payload = await readUploadResponse(response);
      if (!response.ok || !payload.url) throw new Error(payload.error ?? '上传失败');
      onChange(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '上传失败');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="admin-image-field">
      <TextField label={label} value={value} onChange={onChange} hint="可填写 /images/文件名，也可直接上传；较大的图片会自动优化。" />
      <div className="admin-image-row">
        <div className="admin-image-preview">
          {value ? <img src={value} alt="当前图片预览" /> : <ImagePlus aria-hidden="true" />}
        </div>
        <button type="button" className="admin-secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          {uploading ? '上传中' : '上传图片'}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }} />
      </div>
      {error && <p className="admin-inline-error">{error}</p>}
    </div>
  );
}

function CardHeader({ title, eyebrow, onDelete }: { title: string; eyebrow?: string; onDelete?: () => void }) {
  return (
    <div className="admin-card-header">
      <div>{eyebrow && <small>{eyebrow}</small>}<h3>{title}</h3></div>
      {onDelete && <button type="button" className="admin-icon-button" onClick={onDelete} aria-label={`删除${title}`}><Trash2 aria-hidden="true" /></button>}
    </div>
  );
}

export function AdminEditor({ editorName }: { editorName: string }) {
  const [section, setSection] = useState<AdminSection>('home');
  const [content, setContent] = useState<SiteContentDocument>(() => cloneContent(defaultSiteContent));
  const [selectedArticle, setSelectedArticle] = useState(0);
  const [persistence, setPersistence] = useState('正在读取');
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '修改后点击保存' });
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch('/api/content', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as { content?: SiteContentDocument; persistence?: string };
        if (payload.content) setContent(cloneContent(payload.content));
        setPersistence(payload.persistence === 'database' ? 'Supabase 云端' : payload.persistence === 'unconfigured' ? '等待连接 Supabase' : '默认内容');
      })
      .catch(() => setStatus({ tone: 'error', message: '读取内容失败，当前显示默认内容' }));
  }, []);

  const activeArticleIndex = Math.min(selectedArticle, Math.max(0, content.articles.length - 1));
  const activeArticle = content.articles[activeArticleIndex];
  const articleWordCount = useMemo(() => activeArticle?.blocks.reduce((count, block) => {
    if (block.type === 'section') return count + block.heading.length + block.paragraphs.join('').replace(/<[^>]+>/g, '').length;
    return count + block.caption.length;
  }, 0) ?? 0, [activeArticle]);

  const mutate = (change: (draft: SiteContentDocument) => void) => {
    setContent((current) => {
      const draft = cloneContent(current);
      change(draft);
      return draft;
    });
    setStatus({ tone: 'idle', message: '有尚未保存的修改' });
  };

  const save = async () => {
    setStatus({ tone: 'saving', message: '正在保存…' });
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(content),
      });
      const payload = await response.json() as { persistence?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? '保存失败');
      setPersistence(payload.persistence === 'database' ? 'Supabase 云端' : '默认内容');
      setStatus({ tone: 'success', message: '内容已保存，公开页面会自动读取新版本' });
      window.dispatchEvent(new Event('site-content-updated'));
    } catch (reason) {
      setStatus({ tone: 'error', message: reason instanceof Error ? reason.message : '保存失败' });
    }
  };

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `zhiyue-content-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importContent = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!isSiteContentDocument(parsed)) throw new Error('文件缺少必要栏目');
      setContent(cloneContent(parsed));
      setSelectedArticle(0);
      setStatus({ tone: 'idle', message: '已导入，点击保存后生效' });
    } catch (reason) {
      setStatus({ tone: 'error', message: reason instanceof Error ? reason.message : '导入失败' });
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const updateArticle = <Key extends keyof Article>(key: Key, value: Article[Key]) => {
    mutate((draft) => { draft.articles[activeArticleIndex][key] = value; });
  };

  const updateBlock = (index: number, block: ArticleBlock) => {
    mutate((draft) => { draft.articles[activeArticleIndex].blocks[index] = block; });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/"><span>智跃书海</span><small>内容管理后台</small></a>
        <nav aria-label="后台栏目">
          <button type="button" aria-current={section === 'home'} onClick={() => setSection('home')}><span>01</span>首页内容</button>
          <button type="button" aria-current={section === 'articles'} onClick={() => setSection('articles')}><span>02</span>文章管理</button>
          <button type="button" aria-current={section === 'journey'} onClick={() => setSection('journey')}><span>03</span>问卷设置</button>
          <button type="button" aria-current={section === 'responses'} onClick={() => setSection('responses')}><span>04</span>答卷数据</button>
        </nav>
        <div className="admin-sidebar-meta">
          <span className="admin-dot" />
          <div><b>{persistence}</b><small>{editorName}</small></div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p>内容工作台</p><h1>{sectionTitles[section]}</h1></div>
          <div className="admin-top-actions">
            <a className="admin-secondary" href="/" target="_blank">预览网站 <ArrowUpRight aria-hidden="true" /></a>
            <form action="/api/admin/logout" method="post"><button type="submit" className="admin-secondary">退出登录</button></form>
            <button type="button" className="admin-primary" onClick={() => void save()} disabled={status.tone === 'saving'}>
              {status.tone === 'saving' ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : status.tone === 'success' ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}
              保存内容
            </button>
          </div>
        </header>

        <div className={`admin-status ${status.tone}`}><span>{status.message}</span><b>{persistence}</b></div>

        {section === 'home' && (
          <div className="admin-content-stack">
            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>Brand</p><h2>品牌信息</h2></div></div>
              <div className="admin-form-grid">
                <TextField label="品牌名称" value={content.siteIdentity.name} onChange={(value) => mutate((draft) => { draft.siteIdentity.name = value; })} />
                <TextField label="团队全称" value={content.siteIdentity.teamName} onChange={(value) => mutate((draft) => { draft.siteIdentity.teamName = value; })} />
                <div className="admin-span-2"><ImageField label="Logo" value={content.siteIdentity.logo} onChange={(value) => mutate((draft) => { draft.siteIdentity.logo = value; })} /></div>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>Carousel</p><h2>首页轮播</h2></div><button type="button" className="admin-secondary" onClick={() => mutate((draft) => draft.homeStories.push({ title: '新轮播', note: '填写说明', image: '', href: '/articles' }))}><Plus aria-hidden="true" /> 添加</button></div>
              <div className="admin-repeater">
                {content.homeStories.map((story, index) => (
                  <div className="admin-card" key={`${story.title}-${index}`}>
                    <CardHeader title={story.title || `轮播 ${index + 1}`} eyebrow={`第 ${index + 1} 张`} onDelete={content.homeStories.length > 1 ? () => mutate((draft) => { draft.homeStories.splice(index, 1); }) : undefined} />
                    <div className="admin-form-grid">
                      <TextField label="标题" value={story.title} onChange={(value) => mutate((draft) => { draft.homeStories[index].title = value; })} />
                      <TextField label="链接" value={story.href} onChange={(value) => mutate((draft) => { draft.homeStories[index].href = value; })} />
                      <div className="admin-span-2"><TextField label="简短说明" value={story.note} onChange={(value) => mutate((draft) => { draft.homeStories[index].note = value; })} /></div>
                      <div className="admin-span-2"><ImageField label="轮播图片" value={story.image} onChange={(value) => mutate((draft) => { draft.homeStories[index].image = value; })} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>Publications</p><h2>教辅封面</h2></div><button type="button" className="admin-secondary" onClick={() => mutate((draft) => draft.publicationCards.push({ label: '新教辅', title: '填写名称', image: '', imageAlt: '' }))}><Plus aria-hidden="true" /> 添加</button></div>
              <div className="admin-repeater two-columns">
                {content.publicationCards.map((book, index) => (
                  <div className="admin-card" key={`${book.label}-${index}`}>
                    <CardHeader title={book.title || `教辅 ${index + 1}`} onDelete={() => mutate((draft) => { draft.publicationCards.splice(index, 1); })} />
                    <TextField label="封面角标" value={book.label} onChange={(value) => mutate((draft) => { draft.publicationCards[index].label = value; })} />
                    <TextField label="教辅名称" value={book.title} onChange={(value) => mutate((draft) => { draft.publicationCards[index].title = value; })} />
                    <ImageField label="竖版封面" value={book.image} onChange={(value) => mutate((draft) => { draft.publicationCards[index].image = value; draft.publicationCards[index].imageAlt = book.title; })} />
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>News</p><h2>新闻动态</h2></div><button type="button" className="admin-secondary" onClick={() => mutate((draft) => draft.homeNews.push({ date: '待补充', title: '新动态', href: '/articles' }))}><Plus aria-hidden="true" /> 添加</button></div>
              <div className="admin-repeater">
                {content.homeNews.map((item, index) => (
                  <div className="admin-card compact" key={`${item.title}-${index}`}>
                    <CardHeader title={item.title || `动态 ${index + 1}`} onDelete={() => mutate((draft) => { draft.homeNews.splice(index, 1); })} />
                    <div className="admin-form-grid three">
                      <TextField label="日期" value={item.date} onChange={(value) => mutate((draft) => { draft.homeNews[index].date = value; })} />
                      <TextField label="标题" value={item.title} onChange={(value) => mutate((draft) => { draft.homeNews[index].title = value; })} />
                      <TextField label="链接" value={item.href} onChange={(value) => mutate((draft) => { draft.homeNews[index].href = value; })} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === 'articles' && (
          <div className="admin-article-layout">
            <aside className="admin-article-list">
              <button type="button" className="admin-add-article" onClick={() => {
                mutate((draft) => draft.articles.push({
                  slug: `new-article-${Date.now()}`,
                  category: '项目进展', date: '待补充', title: '新文章', summary: '填写文章摘要', image: '', imageAlt: '', lead: '填写文章导语', heroCaption: '',
                  blocks: [{ type: 'section', heading: '正文小标题', paragraphs: ['填写正文内容'] }],
                }));
                setSelectedArticle(content.articles.length);
              }}><Plus aria-hidden="true" /> 新建文章</button>
              {content.articles.map((article, index) => (
                <button type="button" key={article.slug} aria-current={activeArticleIndex === index} onClick={() => setSelectedArticle(index)}>
                  <span>{article.category}</span><b>{article.title}</b><small>{article.date}</small>
                </button>
              ))}
            </aside>
            {activeArticle && <section className="admin-panel admin-article-editor">
              <div className="admin-panel-heading"><div><p>{articleWordCount} 字</p><h2>{activeArticle.title}</h2></div><button type="button" className="admin-danger" onClick={() => {
                mutate((draft) => { draft.articles.splice(activeArticleIndex, 1); });
                setSelectedArticle(Math.max(0, activeArticleIndex - 1));
              }}><Trash2 aria-hidden="true" /> 删除文章</button></div>
              <div className="admin-form-grid">
                <TextField label="文章标题" value={activeArticle.title} onChange={(value) => updateArticle('title', value)} />
                <TextField label="文章地址 slug" value={activeArticle.slug} onChange={(value) => updateArticle('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} hint={`访问地址：/articles/${activeArticle.slug}`} />
                <label className="admin-field"><span>分类</span><select value={activeArticle.category} onChange={(event) => updateArticle('category', event.target.value as Article['category'])}><option>新闻动态</option><option>项目进展</option><option>实践感悟</option></select></label>
                <TextField label="日期" value={activeArticle.date} onChange={(value) => updateArticle('date', value)} />
                <div className="admin-span-2"><TextField label="列表摘要" value={activeArticle.summary} onChange={(value) => updateArticle('summary', value)} multiline /></div>
                <div className="admin-span-2"><TextField label="详情页导语" value={activeArticle.lead} onChange={(value) => updateArticle('lead', value)} multiline /></div>
                <div className="admin-span-2"><ImageField label="文章封面" value={activeArticle.image} onChange={(value) => updateArticle('image', value)} /></div>
                <TextField label="封面替代文字" value={activeArticle.imageAlt} onChange={(value) => updateArticle('imageAlt', value)} />
                <TextField label="封面图片说明" value={activeArticle.heroCaption} onChange={(value) => updateArticle('heroCaption', value)} />
              </div>
              <div className="admin-block-heading"><div><p>Body</p><h3>文章正文</h3></div><div><button type="button" className="admin-secondary" onClick={() => updateArticle('blocks', [...activeArticle.blocks, { type: 'section', heading: '新小标题', paragraphs: ['填写正文'] }])}><Plus aria-hidden="true" /> 段落</button><button type="button" className="admin-secondary" onClick={() => updateArticle('blocks', [...activeArticle.blocks, { type: 'image', src: '', alt: '', caption: '' }])}><ImagePlus aria-hidden="true" /> 插图</button></div></div>
              <div className="admin-repeater">
                {activeArticle.blocks.map((block, index) => (
                  <div className="admin-card" key={`${block.type}-${index}`}>
                    <CardHeader title={block.type === 'section' ? (block.heading || '正文段落') : '正文插图'} eyebrow={block.type === 'section' ? '段落' : '图片'} onDelete={() => updateArticle('blocks', activeArticle.blocks.filter((_, blockIndex) => blockIndex !== index))} />
                    {block.type === 'section' ? <>
                      <TextField label="小标题" value={block.heading} onChange={(value) => updateBlock(index, { ...block, heading: value })} />
                      <RichTextEditor label="正文" value={block.paragraphs} onChange={(paragraphs) => updateBlock(index, { ...block, paragraphs })} />
                    </> : <>
                      <ImageField label="插图" value={block.src} onChange={(value) => updateBlock(index, { ...block, src: value })} />
                      <TextField label="图片说明" value={block.caption} onChange={(value) => updateBlock(index, { ...block, caption: value })} />
                      <TextField label="替代文字" value={block.alt} onChange={(value) => updateBlock(index, { ...block, alt: value })} />
                    </>}
                  </div>
                ))}
              </div>
            </section>}
          </div>
        )}

        {section === 'journey' && (
          <div className="admin-content-stack">
            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>Cover</p><h2>问卷封面</h2></div></div>
              <div className="admin-form-grid">
                <TextField label="眉题" value={content.journeyCover.kicker} onChange={(value) => mutate((draft) => { draft.journeyCover.kicker = value; })} />
                <TextField label="主标题" value={content.journeyCover.title} onChange={(value) => mutate((draft) => { draft.journeyCover.title = value; })} />
                <TextField label="说明第一行" value={content.journeyCover.descriptionBeforeBreak} onChange={(value) => mutate((draft) => { draft.journeyCover.descriptionBeforeBreak = value; })} />
                <TextField label="说明第二行" value={content.journeyCover.descriptionAfterBreak} onChange={(value) => mutate((draft) => { draft.journeyCover.descriptionAfterBreak = value; })} />
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading"><div><p>Questions</p><h2>八道问卷题目</h2></div></div>
              <div className="admin-repeater">
                {content.journeyQuestionTemplates.map((question, index) => (
                  <div className="admin-card" key={`${question.title}-${index}`}>
                    <CardHeader title={question.title || `第 ${index + 1} 题`} eyebrow={`第 ${String(index + 1).padStart(2, '0')} 题`} />
                    <div className="admin-form-grid">
                      <TextField label="题目" value={question.title} onChange={(value) => mutate((draft) => { draft.journeyQuestionTemplates[index].title = value; })} />
                      <TextField label="答题提示" value={question.hint} onChange={(value) => mutate((draft) => { draft.journeyQuestionTemplates[index].hint = value; })} />
                    </div>
                    {question.options && <TextField label="选项（每行一个）" value={question.options.join('\n')} onChange={(value) => mutate((draft) => { draft.journeyQuestionTemplates[index].options = value.split('\n').filter(Boolean); })} multiline />}
                    {question.optionsByRole && <div className="admin-role-options">{roles.map((role) => <TextField key={role} label={`${role}选项（每行一个）`} value={(question.optionsByRole?.[role] ?? []).join('\n')} onChange={(value) => mutate((draft) => {
                      const target = draft.journeyQuestionTemplates[index];
                      target.optionsByRole = { ...(target.optionsByRole ?? {}), [role]: value.split('\n').filter(Boolean) };
                    })} multiline />)}</div>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === 'responses' && <SurveyDashboard />}

        <footer className="admin-footer-tools">
          <div><FileJson aria-hidden="true" /><span>备份与迁移</span></div>
          <button type="button" className="admin-secondary" onClick={exportContent}><Download aria-hidden="true" /> 导出 JSON</button>
          <button type="button" className="admin-secondary" onClick={() => importRef.current?.click()}><Upload aria-hidden="true" /> 导入 JSON</button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importContent(file);
          }} />
          <button type="button" className="admin-secondary" onClick={() => { setContent(cloneContent(defaultSiteContent)); setStatus({ tone: 'idle', message: '已恢复默认草稿，点击保存后生效' }); }}><RotateCcw aria-hidden="true" /> 恢复默认</button>
        </footer>
      </main>
    </div>
  );
}
