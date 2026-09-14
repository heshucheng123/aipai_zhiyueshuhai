/*
 * 网站内容入口
 * 图片：先放入 public/images，再把 image / src 改为 /images/文件名。
 * 文章：复制 articles 中的一项，修改 slug、标题、图片和 blocks 即可。
 * 首页轮播与新闻：修改 homeStories、homeNews，可链接到任意文章 slug。
 */

export const siteIdentity = {
  name: '智跃书海',
  teamName: '基于大模型的数字教学资源创新实践团队',
  logo: '/images/logo-mark.png',
};

export const homeStories = [
  {
    title: '探访山东教育出版社',
    note: '走进教育出版一线，观察数字资源建设的真实场景',
    image: '/images/team-photo.jpeg',
    href: '/articles/shandong-education',
  },
  {
    title: '与教材编辑面对面',
    note: '从编写、审核到持续修订，厘清 AI 的应用边界',
    image: '/images/editor-interview.jpeg',
    href: '/articles/editor-workflow',
  },
  {
    title: '数字内容如何被制作',
    note: '进入多媒体录制空间，理解内容从纸面走向屏幕的过程',
    image: '/images/studio.jpeg',
    href: '/articles/multimedia-production',
  },
];

export const publicationCards = [
  { label: '教辅封面 01', title: '请替换为实际教辅名称', image: '', imageAlt: '' },
  { label: '教辅封面 02', title: '请替换为实际教辅名称', image: '', imageAlt: '' },
  { label: '教辅封面 03', title: '请替换为实际教辅名称', image: '', imageAlt: '' },
  { label: '教辅封面 04', title: '请替换为实际教辅名称', image: '', imageAlt: '' },
];

export const homeNews = [
  { date: '2026.08.20', title: '走进山东教育出版社，求索人工智能赋能教育出版', href: '/articles/shandong-education' },
  { date: '待补充', title: '教材编辑流程与 AI 应用边界', href: '/articles/editor-workflow' },
  { date: '待补充', title: '多媒体内容生产空间参观记录', href: '/articles/multimedia-production' },
  { date: '待补充', title: '一名团队成员的实践感悟', href: '/articles/digital-publishing-reflection' },
];

export type ArticleBlock =
  | { type: 'section'; heading: string; paragraphs: string[] }
  | { type: 'image'; src: string; alt: string; caption: string };

export type Article = {
  slug: string;
  category: '新闻动态' | '项目进展' | '实践感悟';
  date: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  lead: string;
  heroCaption: string;
  blocks: ArticleBlock[];
};

export const articleCategories = ['全部文章', '新闻动态', '项目进展', '实践感悟'] as const;

export const articles: Article[] = [
  {
    slug: 'shandong-education',
    category: '新闻动态',
    date: '2026.08.20',
    title: '探访山东教育出版社，求索人工智能赋能教育出版创新发展之路',
    summary: '围绕智慧教育项目、教材教辅生产、数字资源建设和 AI 应用边界开展参观与访谈。',
    image: '/images/team-photo.jpeg',
    imageAlt: '团队在山东教育出版社合影',
    lead: '团队走进山东教育出版社，围绕智慧教育项目、教材教辅生产、数字资源建设、AI 应用边界及多媒体内容生产开展参观学习与专题访谈。',
    heroCaption: '基于大模型的数字教学资源创新实践团队开展实地调研',
    blocks: [
      {
        type: 'section',
        heading: '对话业务骨干，梳理数智出版转型脉络',
        paragraphs: [
          '座谈交流中，山东教育出版社智慧教育中心业务骨干从行业环境、资源基础和合作方式等方面，介绍了出版社推进数字化转型的整体思路。长期深耕教育出版，使出版社积累了优质内容、图书版权、发行渠道，以及服务学校和教师的丰富经验。',
          '教育出版的数智化转型需要围绕内容、技术、渠道与责任边界进行系统重构。出版社既要发挥专业内容与教育资源优势，也要在数据管理、知识产权和内容审核等环节明确责任。',
        ],
      },
      { type: 'image', src: '/images/editor-interview.jpeg', alt: '团队与出版社业务人员开展座谈', caption: '团队与业务人员围绕教材教辅数字化开展交流' },
      {
        type: 'section',
        heading: '走近教材编辑，厘清 AI 赋能应用边界',
        paragraphs: [
          '一线编辑介绍了教材编写、送审、出版、培训、修订及配套资源建设的完整流程。教材印刷出版并不是服务的终点，教师培训、课程资源开发、使用反馈和持续修订，同样构成教育出版的重要环节。',
          '智能工具可以辅助发现文字差错、重复表述和部分规范性问题，但题目正误、知识点是否超纲、教材版本适配以及内容审查等专业判断，仍离不开编辑、学科专家和审核人员。',
        ],
      },
      {
        type: 'section',
        heading: '走进多媒体空间，感受数字内容生产场景',
        paragraphs: ['团队实地走进多媒体录制空间，观察教育内容从纸面资源向视频化、可视化表达延伸的实际形态。无论呈现方式如何变化，专业审核、内容质量与真实教学需求仍是数字内容生产必须坚守的基础。'],
      },
      { type: 'image', src: '/images/studio.jpeg', alt: '山东教育出版社多媒体录制空间', caption: '多媒体录制空间为数字教育内容提供新的呈现方式' },
    ],
  },
  {
    slug: 'editor-workflow',
    category: '项目进展',
    date: '待补充',
    title: '教材编辑流程与 AI 应用边界',
    summary: '梳理教材编写、送审、培训和修订流程，记录编辑工作中的真实需求。',
    image: '/images/editor-interview.jpeg',
    imageAlt: '团队与教材编辑开展访谈',
    lead: '从编辑工作的真实流程出发，梳理数字工具可以协助的环节，以及必须由专业人员完成的判断。',
    heroCaption: '此处可替换为编辑访谈的时间、地点与图片说明',
    blocks: [{ type: 'section', heading: '文章内容待补充', paragraphs: ['请在 content/site-content.ts 中替换这段正文，也可以继续添加 section 或 image 内容块。'] }],
  },
  {
    slug: 'multimedia-production',
    category: '项目进展',
    date: '待补充',
    title: '多媒体内容生产空间参观记录',
    summary: '观察教育内容从纸面资源向视频、微课和可视化表达延伸的实际形态。',
    image: '/images/studio.jpeg',
    imageAlt: '多媒体内容录制空间',
    lead: '记录数字教学资源从脚本、录制到后期制作的生产过程。',
    heroCaption: '此处可替换为参观活动的时间、地点与图片说明',
    blocks: [{ type: 'section', heading: '文章内容待补充', paragraphs: ['请在 content/site-content.ts 中填写参观过程、观察发现与团队思考。'] }],
  },
  {
    slug: 'digital-publishing-reflection',
    category: '实践感悟',
    date: '待补充',
    title: '从一次访谈开始理解数字出版',
    summary: '此处预留团队成员的个人实践记录，可替换标题、摘要和正文。',
    image: '/images/meeting-room.jpeg',
    imageAlt: '团队座谈交流现场',
    lead: '成员感悟页面已经预留，可直接填入作者的观察、问题和收获。',
    heroCaption: '此处可替换为作者、活动时间与图片说明',
    blocks: [{ type: 'section', heading: '文章内容待补充', paragraphs: ['请在 content/site-content.ts 中替换成员感悟正文。'] }],
  },
];

export type JourneyQuestion = { title: string; hint: string; options: string[] };
export type JourneyQuestionTemplate = {
  title: string;
  hint: string;
  options?: string[];
  optionsByRole?: Record<string, string[]>;
  appendOptions?: string[];
};

export const journeyCover = {
  kicker: '一段关于数字教辅的互动体验',
  title: '开启回忆之旅',
  descriptionBeforeBreak: '从熟悉的教辅出发，用八个选择告诉我们：',
  descriptionAfterBreak: '纸质内容可以如何被数字化，又该提供怎样的学习支持。',
  orbitLabels: ['同步', '专题', '试卷', '讲解'],
};

export const journeyQuestionTemplates: JourneyQuestionTemplate[] = [
  { title: '这一次，你想以什么身份参与？', hint: '不同身份会看到稍有不同的数字教辅问题。', options: ['大学生', '初高中教师', '初高中家长', '初高中学生'] },
  { title: '你接触过哪种数字教辅？', hint: '请选择最熟悉的一种形式。', options: ['纸质教辅配套扫码资源', '教辅 App 或小程序', '学校统一使用的数字平台', '电子书或可交互教材', '还没有接触过'] },
  {
    title: '你通常在哪个场景使用数字教辅？',
    hint: '请选择最常见的一种情况。',
    optionsByRole: {
      大学生: ['手机查看解析或答案', '平板完成练习', '电脑观看课程资源', '很少使用数字教辅'],
      初高中教师: ['备课与选题', '课堂展示与讲评', '布置线上练习', '查看班级学情'],
      初高中家长: ['帮助孩子查找讲解', '查看学习进度', '选购或激活数字资源', '陪伴孩子完成练习'],
      初高中学生: ['扫码查看解析', '在线完成练习', '观看视频或动画讲解', '整理错题与复习'],
    },
  },
  { title: '纸质教辅与数字内容怎样连接最方便？', hint: '我们希望了解纸数衔接的真实偏好。', options: ['扫描页码或题目二维码', '拍照识别当前题目', '按教材版本和章节查找', '纸书与账号自动同步进度', '暂时没有偏好'] },
  {
    title: '数字教辅最应该增强哪一种体验？',
    hint: '请选择对你最有价值的一项。',
    optionsByRole: {
      大学生: ['按薄弱点推荐内容', '快速检索知识点', '保留历史错题', '用对话方式解释难题'],
      初高中教师: ['按教材进度组题', '自动汇总班级错题', '生成分层练习', '快速制作课堂讲解'],
      初高中家长: ['看懂孩子的薄弱点', '获得清晰的辅导建议', '了解资源是否适合', '查看阶段性学习反馈'],
      初高中学生: ['得到分步提示', '生成针对性练习', '理解错误原因', '规划复习节奏'],
    },
    appendOptions: ['暂时不需要新增功能'],
  },
  { title: '你希望 AI 在数字教辅中扮演什么角色？', hint: '请选择你最愿意首先尝试的能力。', options: ['根据错因进行分步讲解', '根据学习情况推荐练习', '用对话方式回答知识问题', '帮助教师分析整体学情', '只提供基础检索，不需要 AI'] },
  { title: '选择数字教辅时，你最担心什么？', hint: '这会帮助我们确定产品必须优先解决的问题。', options: ['答案或解析不准确', '与教材版本不匹配', '个人与学习数据被滥用', '功能复杂、容易分心', '付费规则不清楚', '暂时没有明显担忧'] },
  { title: '你愿意试用怎样的数字教辅？', hint: '请选择最接近你目前想法的一项。', options: ['愿意，优先体验个性化学习功能', '愿意，先体验纸书配套数字资源', '需要教师或学校推荐后再试', '先了解内容来源与隐私规则', '暂时不愿意使用'] },
];

export type SiteContentDocument = {
  siteIdentity: typeof siteIdentity;
  homeStories: typeof homeStories;
  publicationCards: typeof publicationCards;
  homeNews: typeof homeNews;
  articles: Article[];
  journeyCover: typeof journeyCover;
  journeyQuestionTemplates: JourneyQuestionTemplate[];
};

export const defaultSiteContent: SiteContentDocument = {
  siteIdentity,
  homeStories,
  publicationCards,
  homeNews,
  articles,
  journeyCover,
  journeyQuestionTemplates,
};

export function buildJourneyQuestions(
  identity: string,
  templates: JourneyQuestionTemplate[] = journeyQuestionTemplates,
): JourneyQuestion[] {
  return templates.map((question) => {
    const roleOptions = question.optionsByRole?.[identity]
      ?? question.optionsByRole?.['初高中学生'];
    return {
      title: question.title,
      hint: question.hint,
      options: [...(question.options ?? roleOptions ?? []), ...(question.appendOptions ?? [])],
    };
  });
}

export function isSiteContentDocument(value: unknown): value is SiteContentDocument {
  if (!value || typeof value !== 'object') return false;
  const content = value as Partial<SiteContentDocument>;
  return Boolean(
    content.siteIdentity
    && Array.isArray(content.homeStories)
    && Array.isArray(content.publicationCards)
    && Array.isArray(content.homeNews)
    && Array.isArray(content.articles)
    && content.journeyCover
    && Array.isArray(content.journeyQuestionTemplates),
  );
}
