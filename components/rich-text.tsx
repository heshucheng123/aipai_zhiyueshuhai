import { createElement, type ReactNode } from 'react';

type RichTag = 'p' | 'br' | 'strong' | 'em' | 'u' | 'ul' | 'ol' | 'li' | 'blockquote';
type RichNode = { tag: RichTag; children: Array<RichNode | string>; firstLineIndent?: boolean };

const RICH_TAG_PATTERN = /(<\/?(?:p|div|br|strong|b|em|i|u|ul|ol|li|blockquote)(?:\s[^>]*)?>)/gi;
const BLOCK_TAG_PATTERN = /<(?:p|div|ul|ol|blockquote)\b/i;

function normalizeTag(tag: string): RichTag {
  if (tag === 'b') return 'strong';
  if (tag === 'i') return 'em';
  if (tag === 'div') return 'p';
  return tag as RichTag;
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) => {
    if (entity[0] === '#') {
      const hexadecimal = entity[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : '';
    }
    return named[entity.toLowerCase()] ?? '';
  });
}

function parseRichText(source: string): Array<RichNode | string> {
  const root: { children: Array<RichNode | string> } = { children: [] };
  const stack: Array<{ tag?: RichTag; children: Array<RichNode | string> }> = [root];

  for (const token of source.split(RICH_TAG_PATTERN).filter(Boolean)) {
    const tagMatch = token.match(/^<\/?\s*([a-z]+)/i);
    if (!tagMatch) {
      stack.at(-1)?.children.push(decodeEntities(token));
      continue;
    }

    const tag = normalizeTag(tagMatch[1].toLowerCase());
    const closing = /^<\//.test(token);
    if (closing) {
      const matchIndex = stack.findLastIndex((item) => item.tag === tag);
      if (matchIndex > 0) stack.splice(matchIndex);
      continue;
    }

    const node: RichNode = {
      tag,
      children: [],
      firstLineIndent: tag === 'p' && /data-first-line-indent\s*=\s*["']true["']/i.test(token),
    };
    stack.at(-1)?.children.push(node);
    if (tag !== 'br') stack.push(node);
  }

  return root.children;
}

function renderNode(node: RichNode | string, key: string): ReactNode {
  if (typeof node === 'string') return node;
  const children = node.children.map((child, index) => renderNode(child, `${key}-${index}`));
  return createElement(node.tag, { key, className: node.firstLineIndent ? 'rich-first-line-indent' : undefined }, ...children);
}

export function RichText({ paragraphs }: { paragraphs: string[] }) {
  const source = paragraphs.map((paragraph) => BLOCK_TAG_PATTERN.test(paragraph) ? paragraph : `<p>${paragraph}</p>`).join('');
  return <div className="article-rich-text">{parseRichText(source).map((node, index) => renderNode(node, String(index)))}</div>;
}
