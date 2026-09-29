import React, { useMemo } from 'react';

interface RichContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Basic Markdown to HTML converter for legacy posts or markdown content
 */
function markdownToHtml(md: string): string {
  if (!md) return '';

  let html = md;

  // Escape basic HTML tags unless they are intentional formatting
  // Check if content already contains extensive HTML
  const hasHtml = /<\/?(p|div|h[1-6]|table|tr|td|th|ul|ol|li|blockquote|strong|b|em|i|u|s|mark|code|pre|hr|a)[\s>]/i.test(md);
  if (hasHtml) {
    return md;
  }

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/gim, '<s>$1</s>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Code
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered list items
  html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  // Clean nested duplicate uls
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<oli>$1</oli>');
  html = html.replace(/(<oli>.*<\/oli>)/gims, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');
  html = html.replace(/<oli>/gim, '<li>');
  html = html.replace(/<\/oli>/gim, '</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|pre|table|div)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className = '',
}) => {
  const processedHtml = useMemo(() => {
    if (!content) return '';
    const converted = markdownToHtml(content);

    // Ensure all tables are wrapped in a horizontally scrollable container for mobile responsiveness
    let withScrollableTables = converted;
    if (converted.includes('<table') && !converted.includes('overflow-x-auto')) {
      withScrollableTables = converted.replace(
        /(<table[^>]*>[\s\S]*?<\/table>)/gi,
        '<div class="overflow-x-auto my-4">$1</div>',
      );
    }

    return withScrollableTables;
  }, [content]);

  if (!content) {
    return (
      <div className="text-slate-400 dark:text-slate-500 italic py-4">
        Chưa có nội dung để hiển thị...
      </div>
    );
  }

  return (
    <div
      className={`rich-post-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};
