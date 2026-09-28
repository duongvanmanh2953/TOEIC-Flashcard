import JSZip from 'jszip';

/**
 * Text-only Document Parser for Word (.docx), PDF (.pdf), Markdown (.md), and Text (.txt).
 * Extracts structured plain text / markdown while completely discarding images and binary media.
 */
export async function parseDocumentFile(file: File): Promise<{ title: string; content: string }> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();
  const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();

  let extractedText = '';

  if (extension === 'docx') {
    extractedText = await parseDocx(file);
  } else if (extension === 'pdf') {
    extractedText = await parsePdf(file);
  } else if (extension === 'txt' || extension === 'md') {
    extractedText = await file.text();
  } else {
    throw new Error('Định dạng không được hỗ trợ. Vui lòng chọn tệp .docx, .pdf, .md hoặc .txt.');
  }

  return {
    title: titleWithoutExt,
    content: extractedText.trim(),
  };
}

async function parseDocx(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const docXml = await zip.file('word/document.xml')?.async('text');
  if (!docXml) {
    throw new Error('Tệp Word (.docx) không hợp lệ hoặc bị hỏng.');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'application/xml');
  const paragraphs = xmlDoc.getElementsByTagName('w:p');

  const lines: string[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textNodes = p.getElementsByTagName('w:t');
    let paragraphText = '';
    for (let j = 0; j < textNodes.length; j++) {
      paragraphText += textNodes[j].textContent || '';
    }
    if (paragraphText.trim()) {
      lines.push(paragraphText.trim());
    }
  }

  return lines.join('\n\n');
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  
  // Convert binary to string safely in chunks to extract text streams
  let raw = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    raw += String.fromCharCode.apply(null, Array.from(uint8.subarray(i, i + chunkSize)));
  }

  // Extract text within PDF text blocks: BT ... ET
  const textBlocks: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match;

  while ((match = btRegex.exec(raw)) !== null) {
    const block = match[0];
    // Match literal strings e.g. (Hello World) or hex strings <48656C6C6F>
    const strRegex = /\((.*?)\)|<([0-9a-fA-F]+)>/g;
    let strMatch;
    let blockText = '';
    while ((strMatch = strRegex.exec(block)) !== null) {
      if (strMatch[1]) {
        blockText += strMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
      } else if (strMatch[2]) {
        // Hex encoded text
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
    // Fallback: extract plain ascii text sequences
    const asciiMatches = raw.match(/[A-Za-z0-9\s.,;:'"?!@#$%^&*()_+\-=[\]{}|/<>~`]{4,}/g);
    if (asciiMatches) {
      return asciiMatches.filter((s) => s.trim().length > 3).join('\n\n');
    }
    throw new Error('Không thể trích xuất văn bản từ tệp PDF này (có thể là tệp scan hoặc được mã hóa).');
  }

  return textBlocks.join('\n\n');
}
