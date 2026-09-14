# 内容与图片修改入口

网站中的首页轮播、出版物卡片、新闻、文章列表、文章正文和问卷文字，都集中在 `content/site-content.ts`。

## 替换图片

1. 把图片复制到 `public/images`。
2. 在 `site-content.ts` 中找到对应的 `image` 或 `src`。
3. 将路径改为 `/images/你的文件名.jpg`。

首页轮播图片在 `homeStories`，教辅封面在 `publicationCards`，文章封面和正文图片在 `articles`。图片建议使用 JPG、PNG 或 WebP；轮播和文章封面建议采用横图，教辅封面建议采用竖图。

## 新增文章

1. 在 `articles` 数组中复制一整项。
2. 把 `slug` 改成不重复的英文短名，例如 `teacher-interview`。
3. 修改分类、日期、标题、摘要、封面、导语和 `blocks` 正文。
4. 文章地址会自动变成 `/articles/slug`，并自动出现在“实践记录”页面。

正文支持两种内容块：

- `section`：小标题与若干正文段落。
- `image`：正文图片、替代文字与图片说明。

如需让文章出现在首页轮播或新闻区，在 `homeStories` 或 `homeNews` 中填写它的地址即可。

## 使用内容后台

本地开发时访问 `/admin`。后台可以编辑品牌、首页轮播、教辅封面、新闻、文章正文和问卷，并支持图片上传及 JSON 备份。

内容、上传图片和答卷统一保存在 Supabase，后台使用 Supabase 邮箱和密码登录。数据库与 Vercel 环境变量的配置方法见项目根目录 `DEPLOYMENT.md`。
