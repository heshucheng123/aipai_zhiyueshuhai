'use client';

import { useEffect, useId, useRef } from 'react';
import { Bold, CornerDownLeft, IndentIncrease, Italic, List, ListOrdered, Quote, Redo2, RemoveFormatting, Underline, Undo2 } from 'lucide-react';

const ALLOWED_TAGS = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);
const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);

function sanitizeEditorHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;

  const clean = (parent: ParentNode) => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === Node.COMMENT_NODE) {
        node.remove();
        continue;
      }
      if (!(node instanceof HTMLElement)) continue;
      if (BLOCKED_TAGS.has(node.tagName)) {
        node.remove();
        continue;
      }
      clean(node);
      if (!ALLOWED_TAGS.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        continue;
      }
      const keepsFirstLineIndent = ['P', 'DIV'].includes(node.tagName) && node.getAttribute('data-first-line-indent') === 'true';
      for (const attribute of Array.from(node.attributes)) node.removeAttribute(attribute.name);
      if (keepsFirstLineIndent) node.setAttribute('data-first-line-indent', 'true');
    }
  };

  clean(template.content);
  return template.innerHTML;
}

function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => {
    const safe = sanitizeEditorHtml(paragraph);
    return /<(?:p|div|ul|ol|blockquote)\b/i.test(safe) ? safe : `<p>${safe}</p>`;
  }).join('');
}

function hasVisibleContent(html: string): boolean {
  const template = document.createElement('template');
  template.innerHTML = html;
  return Boolean(template.content.textContent?.replace(/\u00a0/g, ' ').trim());
}

type EditorCommand = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'insertParagraph' | 'removeFormat' | 'undo' | 'redo';

export function RichTextEditor({ label, value, onChange }: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const nextHtml = paragraphsToHtml(value);
    if (editor.innerHTML !== nextHtml) editor.innerHTML = nextHtml;
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = sanitizeEditorHtml(editor.innerHTML);
    onChange(hasVisibleContent(safeHtml) ? [safeHtml] : []);
  };

  const runCommand = (command: EditorCommand, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emitChange();
  };

  const toggleQuote = () => {
    const currentBlock = String(document.queryCommandValue('formatBlock')).toLowerCase();
    runCommand('removeFormat');
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, currentBlock === 'blockquote' ? 'p' : 'blockquote');
    emitChange();
  };

  const toggleFirstLineIndent = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    const blocks = Array.from(editor.querySelectorAll<HTMLElement>('p, div'))
      .filter((block) => range.intersectsNode(block));
    const currentBlock = range.startContainer instanceof HTMLElement
      ? range.startContainer.closest<HTMLElement>('p, div')
      : range.startContainer.parentElement?.closest<HTMLElement>('p, div');
    if (blocks.length === 0 && currentBlock && editor.contains(currentBlock)) blocks.push(currentBlock);
    if (blocks.length === 0) return;

    const shouldIndent = blocks.some((block) => block.dataset.firstLineIndent !== 'true');
    for (const block of blocks) {
      if (shouldIndent) block.dataset.firstLineIndent = 'true';
      else delete block.dataset.firstLineIndent;
    }
    emitChange();
  };

  const keepSelection = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <div className="admin-rich-field">
      <span id={labelId}>{label}</span>
      <div className="admin-rich-editor">
        <div className="admin-rich-toolbar" role="toolbar" aria-label="正文格式">
          <button type="button" title="加粗（Ctrl+B）" aria-label="加粗" onMouseDown={keepSelection} onClick={() => runCommand('bold')}><Bold aria-hidden="true" /></button>
          <button type="button" title="斜体（Ctrl+I）" aria-label="斜体" onMouseDown={keepSelection} onClick={() => runCommand('italic')}><Italic aria-hidden="true" /></button>
          <button type="button" title="下划线（Ctrl+U）" aria-label="下划线" onMouseDown={keepSelection} onClick={() => runCommand('underline')}><Underline aria-hidden="true" /></button>
          <span aria-hidden="true" />
          <button type="button" title="项目符号" aria-label="项目符号" onMouseDown={keepSelection} onClick={() => runCommand('insertUnorderedList')}><List aria-hidden="true" /></button>
          <button type="button" title="编号列表" aria-label="编号列表" onMouseDown={keepSelection} onClick={() => runCommand('insertOrderedList')}><ListOrdered aria-hidden="true" /></button>
          <button type="button" title="引用" aria-label="引用" onMouseDown={keepSelection} onClick={toggleQuote}><Quote aria-hidden="true" /></button>
          <button type="button" title="首行缩进两个字符" aria-label="首行缩进" onMouseDown={keepSelection} onClick={toggleFirstLineIndent}><IndentIncrease aria-hidden="true" /><b>首行缩进</b></button>
          <button type="button" title="另起一段" aria-label="另起一段" onMouseDown={keepSelection} onClick={() => runCommand('insertParagraph')}><CornerDownLeft aria-hidden="true" /><b>换行</b></button>
          <span aria-hidden="true" />
          <button type="button" title="清除格式" aria-label="清除格式" onMouseDown={keepSelection} onClick={() => runCommand('removeFormat')}><RemoveFormatting aria-hidden="true" /></button>
          <button type="button" title="撤销" aria-label="撤销" onMouseDown={keepSelection} onClick={() => runCommand('undo')}><Undo2 aria-hidden="true" /></button>
          <button type="button" title="重做" aria-label="重做" onMouseDown={keepSelection} onClick={() => runCommand('redo')}><Redo2 aria-hidden="true" /></button>
        </div>
        <div
          ref={editorRef}
          className="admin-rich-surface"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={() => {
            const editor = editorRef.current;
            if (!editor) return;
            const safeHtml = sanitizeEditorHtml(editor.innerHTML);
            editor.innerHTML = safeHtml;
            onChange(hasVisibleContent(safeHtml) ? [safeHtml] : []);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const clipboardHtml = event.clipboardData.getData('text/html');
            const clipboardText = event.clipboardData.getData('text/plain');
            const safeHtml = clipboardHtml
              ? sanitizeEditorHtml(clipboardHtml)
              : sanitizeEditorHtml(clipboardText.replace(/\r?\n/g, '<br>'));
            document.execCommand('insertHTML', false, safeHtml);
            emitChange();
          }}
          onKeyDown={(event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key.toLowerCase() === 'b') {
              event.preventDefault();
              runCommand('bold');
            }
            if (event.key.toLowerCase() === 'i') {
              event.preventDefault();
              runCommand('italic');
            }
            if (event.key.toLowerCase() === 'u') {
              event.preventDefault();
              runCommand('underline');
            }
          }}
        />
      </div>
      <small>选中文字后设置格式；按 Enter 换段，Shift+Enter 仅换行。</small>
    </div>
  );
}
