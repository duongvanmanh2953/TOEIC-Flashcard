import JSZip from 'jszip';
import { ParsedExamQuestion, InvalidExamQuestionRow } from './examTemplate';

export interface PptxExamParseResult {
  validQuestions: ParsedExamQuestion[];
  invalidQuestions: InvalidExamQuestionRow[];
  totalSlides: number;
  validCount: number;
  invalidCount: number;
}

export const parseAndValidateExamPptx = async (file: File): Promise<PptxExamParseResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Locate all slide XMLs in ppt/slides/
      const slideFiles: { name: string; index: number }[] = [];
      zip.forEach((relativePath) => {
        const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
        if (match) {
          slideFiles.push({
            name: relativePath,
            index: parseInt(match[1], 10),
          });
        }
      });

      // Sort by slide number ascending
      slideFiles.sort((a, b) => a.index - b.index);

      if (slideFiles.length === 0) {
        resolve({
          validQuestions: [],
          invalidQuestions: [{ rowNumber: 1, errors: ['Không tìm thấy slide nào trong file PowerPoint (.pptx).'], rawRow: {} }],
          totalSlides: 0,
          validCount: 0,
          invalidCount: 1,
        });
        return;
      }

      const validQuestions: ParsedExamQuestion[] = [];
      const invalidQuestions: InvalidExamQuestionRow[] = [];
      const parser = new DOMParser();

      for (let i = 0; i < slideFiles.length; i++) {
        const slideInfo = slideFiles[i];
        const slideXmlStr = await zip.file(slideInfo.name)?.async('text');
        if (!slideXmlStr) continue;

        const xmlDoc = parser.parseFromString(slideXmlStr, 'application/xml');

        // Extract paragraphs (<a:p>)
        const paragraphs = Array.from(xmlDoc.getElementsByTagName('a:p'));
        const lines: string[] = [];

        paragraphs.forEach((p) => {
          const textRuns = Array.from(p.getElementsByTagName('a:t'));
          const fullLine = textRuns.map((t) => t.textContent || '').join('').trim();
          if (fullLine) {
            lines.push(fullLine);
          }
        });

        // Skip slide if it's an introduction or title slide with no question/options
        const joinedText = lines.join(' ').toLowerCase();
        if (
          i === 0 &&
          (joinedText.includes('hướng dẫn') || joinedText.includes('instruction') || joinedText.includes('template')) &&
          !joinedText.includes('answer:') &&
          !joinedText.includes('đáp án:')
        ) {
          continue;
        }

        const errors: string[] = [];
        let questionNumber = i + 1;
        let questionText = '';
        const options: { key: string; text: string }[] = [];
        let correctAnswer = '';
        let explanation = '';
        let grammarType = '';
        let category = 'Grammar';
        let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';

        // Parse extracted lines
        lines.forEach((line) => {
          const trimmed = line.trim();

          // Question header detect: e.g. "Question 1", "Câu 1: The manager..."
          const qNumMatch = trimmed.match(/^(?:question|câu)\s*(\d+)[:.]?\s*(.*)$/i);
          if (qNumMatch) {
            questionNumber = parseInt(qNumMatch[1], 10);
            if (qNumMatch[2]) {
              questionText = qNumMatch[2].trim();
            }
            return;
          }

          // Options detect: e.g. "A. complete" or "A) complete"
          const optMatch = trimmed.match(/^([A-D])[.):]\s*(.+)$/i);
          if (optMatch) {
            options.push({
              key: optMatch[1].toUpperCase(),
              text: optMatch[2].trim(),
            });
            return;
          }

          // Answer detect: "Answer: B" or "Đáp án: B"
          const ansMatch = trimmed.match(/^(?:answer|đáp án)[:.]?\s*([A-D\w]+)/i);
          if (ansMatch) {
            correctAnswer = ansMatch[1].trim().toUpperCase();
            return;
          }

          // Explanation detect: "Explanation: ..." or "Giải thích: ..."
          const expMatch = trimmed.match(/^(?:explanation|giải thích)[:.]?\s*(.+)$/i);
          if (expMatch) {
            explanation = expMatch[1].trim();
            return;
          }

          // Grammar detect: "Grammar: Past Simple"
          const gramMatch = trimmed.match(/^(?:grammar|ngữ pháp)[:.]?\s*(.+)$/i);
          if (gramMatch) {
            grammarType = gramMatch[1].trim();
            return;
          }

          // Category detect
          const catMatch = trimmed.match(/^(?:category|danh mục)[:.]?\s*(.+)$/i);
          if (catMatch) {
            category = catMatch[1].trim();
            return;
          }

          // If no question text yet and not metadata, this line is the prompt
          if (!questionText && options.length === 0) {
            questionText = trimmed;
          }
        });

        // Validation
        if (!questionText) {
          errors.push('Không tìm thấy nội dung câu hỏi trong slide.');
        }

        if (options.length < 2) {
          errors.push('Slide cần chứa ít nhất 2 lựa chọn phương án (A. ... và B. ...).');
        }

        if (!correctAnswer) {
          errors.push('Chưa tìm thấy đáp án đúng (cần có dòng "Answer: B" hoặc "Đáp án: B").');
        } else {
          const validKeys = options.map((o) => o.key);
          if (!validKeys.includes(correctAnswer)) {
            errors.push(`Đáp án đúng "${correctAnswer}" không khớp với các lựa chọn trên slide (${validKeys.join(', ')}).`);
          }
        }

        if (errors.length > 0) {
          invalidQuestions.push({
            rowNumber: slideInfo.index,
            questionNumber,
            questionText: questionText || `Slide ${slideInfo.index}`,
            errors,
            rawRow: { lines },
          });
        } else {
          validQuestions.push({
            rowNumber: slideInfo.index,
            questionNumber,
            questionText,
            questionType: 'MULTIPLE_CHOICE',
            options,
            correctAnswer,
            acceptedAnswers: [],
            explanation: explanation || undefined,
            grammarType: grammarType || undefined,
            category,
            skill: 'Reading',
            difficulty,
            points: 1.0,
            tags: ['pptx-import'],
          });
        }
      }

      resolve({
        validQuestions,
        invalidQuestions,
        totalSlides: slideFiles.length,
        validCount: validQuestions.length,
        invalidCount: invalidQuestions.length,
      });
    } catch (err: any) {
      reject(new Error(`Lỗi phân tích file PowerPoint: ${err?.message || 'File PPTX không hợp lệ'}`));
    }
  });
};

export const downloadExamPptxTemplate = async () => {
  // Generates a well-formatted PPTX structure using JSZip with slide XML templates
  const zip = new JSZip();

  // Root Content Types
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  // ppt/presentation.xml
  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
  </p:sldIdLst>
</p:presentation>`
  );

  // ppt/_rels/presentation.xml.rels
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`
  );

  // Slide 1: Introduction / Instructions
  const makeSlide = (title: string, paragraphs: string[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:t>${title}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          ${paragraphs.map((p) => `<a:p><a:r><a:t>${p}</a:t></a:r></a:p>`).join('')}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

  zip.file(
    'ppt/slides/slide1.xml',
    makeSlide('Hướng dẫn nhập bộ đề thi bằng PowerPoint', [
      'Mỗi slide tương ứng với một câu hỏi trắc nghiệm.',
      'Cấu trúc chuẩn của một slide câu hỏi:',
      '1. Tiêu đề câu: "Question 1" hoặc "Câu 1"',
      '2. Nội dung câu hỏi đề bài',
      '3. Các phương án: "A. ...", "B. ...", "C. ...", "D. ..."',
      '4. Dòng đáp án: "Answer: B" hoặc "Đáp án: B"',
      '5. Dòng giải thích: "Explanation: ..."',
      '6. Dòng ngữ pháp: "Grammar: Past Simple"',
    ])
  );

  zip.file(
    'ppt/slides/slide2.xml',
    makeSlide('Question 1', [
      'The manager _____ the annual financial report yesterday.',
      'A. complete',
      'B. completed',
      'C. completing',
      'D. completion',
      'Answer: B',
      'Explanation: "Yesterday" là dấu hiệu của thì quá khứ đơn, vì vậy động từ chia "completed".',
      'Grammar: Past Simple',
      'Category: Grammar',
      'Difficulty: Medium',
    ])
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocalflow_mau_nhap_bo_de_pptx.pptx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
