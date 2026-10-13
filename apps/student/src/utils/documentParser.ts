function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Text-only Document to HTML Parser for Word (.docx), PDF (.pdf), Markdown (.md), and Text (.txt).
 * Converts files into structured, semantic HTML for rich preview and editing,
 * while discarding all images per academic community standards.
 */
export async function parseDocumentFile(file: File): Promise<{ title: string; content: string }> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();
  const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();

  let extractedHtml = '';

  if (extension === 'docx') {
    extractedHtml = await parseDocx(file);
  } else if (extension === 'pdf') {
    extractedHtml = await parsePdf(file);
  } else if (extension === 'md') {
    const text = await file.text();
    extractedHtml = parseMarkdownToHtml(text);
  } else if (extension === 'txt') {
    const text = await file.text();
    extractedHtml = parsePlainTextToHtml(text);
  } else {
    throw new Error('Định dạng không được hỗ trợ. Vui lòng chọn tệp .docx, .pdf, .md hoặc .txt.');
  }

  return {
    title: titleWithoutExt,
    content: extractedHtml.trim(),
  };
}

/**
 * Parses Word (.docx) documents into clean, semantic HTML using mammoth.
 * Retains headings, bold/italics, lists, tables, and blockquotes while stripping all images.
 */
async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const options = {
    styleMap: [
      "p[style-name='Heading 1'] => h2:fresh",
      "p[style-name='Heading 2'] => h3:fresh",
      "p[style-name='Heading 3'] => h4:fresh",
      "p[style-name='Title'] => h2:fresh",
      "p[style-name='Subtitle'] => h3:fresh",
      'u => u',
      'strike => s',
    ],
    ignoreEmptyParagraphs: true,
  };

  let mammothModule: any = null;
  try {
    const mod = await import('mammoth');
    mammothModule = mod.default || mod;
  } catch {
    throw new Error('Thư viện đọc Word (.docx) chưa khả dụng trên môi trường này.');
  }

  const result = await mammothModule.convertToHtml({ arrayBuffer }, options);
  let html = result.value || '';

  // 1. Strip all <img> tags to fulfill rule "Discard images completely"
  html = html.replace(/<img[^>]*>/gi, '');

  // 2. Adjust heading levels: map h1 to h2, h2 to h3, h3 to h4 (since post title is already h1)
  html = html.replace(/<(\/?)h3>/gi, '<$1h4>');
  html = html.replace(/<(\/?)h2>/gi, '<$1h3>');
  html = html.replace(/<(\/?)h1>/gi, '<$1h2>');

  // 3. Wrap tables with responsive container and styling class
  html = html.replace(/<table>/gi, '<div class="overflow-x-auto my-4"><table class="rich-table">');
  html = html.replace(/<\/table>/gi, '</table></div>');

  // 4. Remove empty paragraphs
  html = html.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');

  if (!html.trim()) {
    const rawResult = await mammothModule.extractRawText({ arrayBuffer });
    if (rawResult.value.trim()) {
      return parsePlainTextToHtml(rawResult.value);
    }
    throw new Error('Tệp Word (.docx) trống hoặc không chứa văn bản.');
  }

  return html;
}

/**
 * Parses PDF documents into semantic HTML with headings, paragraphs, and lists.
 */
async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    let pdfjsLib: any = null;
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch {
      throw new Error('Thư viện đọc PDF chưa khả dụng trên môi trường này.');
    }

    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const htmlParts: string[] = [];
    const maxPages = Math.min(numPages, 50);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const rawItems = textContent.items as Array<any>;

      if (!rawItems || rawItems.length === 0) continue;

      // Group items into lines based on Y coordinate
      const lineMap: Map<number, any[]> = new Map();
      const Y_TOLERANCE = 4;

      for (const item of rawItems) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);

        let matchedKey: number | null = null;
        for (const existingY of lineMap.keys()) {
          if (Math.abs(existingY - y) <= Y_TOLERANCE) {
            matchedKey = existingY;
            break;
          }
        }

        if (matchedKey !== null) {
          lineMap.get(matchedKey)!.push(item);
        } else {
          lineMap.set(y, [item]);
        }
      }

      // Sort lines top to bottom
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

      // Calculate average height
      let totalH = 0;
      let count = 0;
      lineMap.forEach((items) => {
        items.forEach((it) => {
          totalH += Math.abs(it.transform[0] || it.transform[3] || 12);
          count++;
        });
      });
      const avgH = count > 0 ? totalH / count : 12;

      let currentListType: 'ul' | 'ol' | null = null;
      let listItems: string[] = [];

      const flushList = () => {
        if (currentListType && listItems.length > 0) {
          htmlParts.push(
            `<${currentListType}>${listItems.map((li) => `<li>${li}</li>`).join('')}</${currentListType}>`
          );
          currentListType = null;
          listItems = [];
        }
      };

      for (const y of sortedYs) {
        const lineItems = lineMap.get(y)!;
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

        const lineText = lineItems.map((it) => it.str).join(' ').trim();
        if (!lineText) continue;

        const firstItem = lineItems[0];
        const h = Math.abs(firstItem.transform[0] || firstItem.transform[3] || avgH);
        const fontName = (firstItem.fontName || '').toLowerCase();
        const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy');

        const bulletMatch = lineText.match(/^([•\-\*–—]|[\u2022\u25AA\u25CF])\s*(.*)$/);
        const numMatch = lineText.match(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s*(.*)$/);

        if (bulletMatch) {
          if (currentListType !== 'ul') {
            flushList();
            currentListType = 'ul';
          }
          listItems.push(escapeHtml(bulletMatch[2] || bulletMatch[1]));
          continue;
        }

        if (numMatch) {
          if (currentListType !== 'ol') {
            flushList();
            currentListType = 'ol';
          }
          listItems.push(escapeHtml(numMatch[2] || numMatch[1]));
          continue;
        }

        flushList();

        if (h > avgH * 1.35 || (isBold && h > avgH * 1.15 && lineText.length < 80)) {
          htmlParts.push(`<h2>${escapeHtml(lineText)}</h2>`);
        } else if (h > avgH * 1.15 && lineText.length < 100) {
          htmlParts.push(`<h3>${escapeHtml(lineText)}</h3>`);
        } else {
          const contentStr = isBold ? `<strong>${escapeHtml(lineText)}</strong>` : escapeHtml(lineText);
          htmlParts.push(`<p>${contentStr}</p>`);
        }
      }

      flushList();
    }

    if (htmlParts.length > 0) {
      return htmlParts.join('\n');
    }
  } catch (err) {
    console.warn('pdfjs extraction failed, trying stream fallback:', err);
  }

  // Fallback to text stream extraction if pdfjs fails
  return fallbackPdfStreamExtract(arrayBuffer);
}

/**
 * Fallback PDF parser: extracts raw text streams and organizes into HTML paragraphs
 */
function fallbackPdfStreamExtract(arrayBuffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(arrayBuffer);
  let raw = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    raw += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + chunkSize)));
  }

  const textBlocks: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match;

  while ((match = btRegex.exec(raw)) !== null) {
    const block = match[0];
    const strRegex = /\((.*?)\)|<([0-9a-fA-F]+)>/g;
    let strMatch;
    let blockText = '';
    while ((strMatch = strRegex.exec(block)) !== null) {
      if (strMatch[1]) {
        blockText += strMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
      } else if (strMatch[2]) {
        const hex = strMatch[2];
        let decoded = '';
        for (let k = 0; k < hex.length; k += 2) {
          decoded += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
        }
        blockText += decoded + ' ';
      }
    }
    if (blockText.trim()) {
      textBlocks.push(blockText.trim());
    }
  }

  if (textBlocks.length === 0) {
    const asciiMatches = raw.match(/[A-Za-z0-9\s.,;:'"?!@#$%^&*()_+\-=[\]{}|/<>~`]{4,}/g);
    if (asciiMatches) {
      return asciiMatches
        .filter((s) => s.trim().length > 3)
        .map((s) => `<p>${escapeHtml(s.trim())}</p>`)
        .join('\n');
    }
    throw new Error('Không thể trích xuất văn bản từ tệp PDF này (tài liệu scan/ảnh hoặc đã bị khóa bảo mật).');
  }

  return textBlocks.map((b) => `<p>${escapeHtml(b)}</p>`).join('\n');
}

/**
 * Converts Markdown string into semantic HTML
 */
function parseMarkdownToHtml(md: string): string {
  if (!md) return '';

  let html = md;
  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/gim, '<s>$1</s>');

  // Blockquote
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Code
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists
  html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<oli>$1</oli>');
  html = html.replace(/(<oli>.*<\/oli>)/gims, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');
  html = html.replace(/<oli>/gim, '<li>');
  html = html.replace(/<\/oli>/gim, '</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  return paragraphs
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
}

/**
 * Converts Plain Text into HTML paragraphs
 */
function parsePlainTextToHtml(text: string): string {
  if (!text) return '';
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
    .filter(Boolean)
    .join('\n');
}
