import * as XLSX from 'xlsx';

export interface ParsedWordItem {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
  cefrLevel?: string;
  topic?: string;
}

export const SAMPLE_TEMPLATE_DATA = [
  {
    'Word (Từ tiếng Anh)': 'compromise',
    'Phonetic (Phiên âm)': '/ˈkɒmprəmaɪz/',
    'PartOfSpeech (Loại từ)': 'noun',
    'Meaning (Nghĩa tiếng Việt)': 'sự thỏa hiệp, nhượng bộ lẫn nhau',
    'Example (Câu ví dụ)': 'Both parties reached a compromise to seal the deal.',
    'CEFR (Trình độ)': 'B2',
    'Topic (Chủ đề)': 'Business English',
  },
  {
    'Word (Từ tiếng Anh)': 'resilient',
    'Phonetic (Phiên âm)': '/rɪˈzɪliənt/',
    'PartOfSpeech (Loại từ)': 'adjective',
    'Meaning (Nghĩa tiếng Việt)': 'kiên cường, có khả năng phục hồi nhanh',
    'Example (Câu ví dụ)': 'The local economy proved remarkably resilient.',
    'CEFR (Trình độ)': 'C1',
    'Topic (Chủ đề)': 'Economics & Finance',
  },
  {
    'Word (Từ tiếng Anh)': 'accommodate',
    'Phonetic (Phiên âm)': '/əˈkɒmədeɪt/',
    'PartOfSpeech (Loại từ)': 'verb',
    'Meaning (Nghĩa tiếng Việt)': 'đáp ứng nhu cầu, cung cấp chỗ ở',
    'Example (Câu ví dụ)': 'The conference hall can accommodate up to 500 delegates.',
    'CEFR (Trình độ)': 'B2',
    'Topic (Chủ đề)': 'Travel & Hospitality',
  },
  {
    'Word (Từ tiếng Anh)': 'collaborate',
    'Phonetic (Phiên âm)': '/kəˈlæbəreɪt/',
    'PartOfSpeech (Loại từ)': 'verb',
    'Meaning (Nghĩa tiếng Việt)': 'hợp tác, phối hợp cùng làm việc',
    'Example (Câu ví dụ)': 'Researchers from diverse fields collaborate on this AI study.',
    'CEFR (Trình độ)': 'B1',
    'Topic (Chủ đề)': 'Technology & Workplace',
  },
  {
    'Word (Từ tiếng Anh)': 'fluctuate',
    'Phonetic (Phiên âm)': '/ˈflʌktʃueɪt/',
    'PartOfSpeech (Loại từ)': 'verb',
    'Meaning (Nghĩa tiếng Việt)': 'dao động, biến động liên tục',
    'Example (Câu ví dụ)': 'Currency exchange rates fluctuate throughout the day.',
    'CEFR (Trình độ)': 'B2',
    'Topic (Chủ đề)': 'Finance & Banking',
  },
];

/**
 * Downloads a pre-formatted Excel or CSV template
 */
export const downloadVocabularyTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Word
    { wch: 18 }, // Phonetic
    { wch: 15 }, // Part of speech
    { wch: 35 }, // Meaning
    { wch: 45 }, // Example
    { wch: 12 }, // CEFR
    { wch: 22 }, // Topic
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'VocabFlow_Template');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'vocabflow_vocabulary_sample_template.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'vocabflow_vocabulary_sample_template.xlsx', { bookType: 'xlsx' });
  }
};

/**
 * Parses uploaded Excel or CSV file into structured ParsedWordItem array
 */
export const parseVocabularyFile = async (file: File): Promise<ParsedWordItem[]> => {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File vượt quá dung lượng tối đa 100MB (Kích thước file: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn file nhỏ hơn.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Không thể đọc dữ liệu từ file.');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        // Find sheet with the most rows to ensure words are not missed if sheet 1 was a cover sheet
        let bestSheetName = workbook.SheetNames[0];
        let maxRowCount = 0;
        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          if (!ws) continue;
          const grid: any[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: '',
            blankrows: false,
          });
          if (grid.length > maxRowCount) {
            maxRowCount = grid.length;
            bestSheetName = sheetName;
          }
        }

        if (!bestSheetName) {
          throw new Error('File Excel/CSV không có worksheet nào.');
        }

        const worksheet = workbook.Sheets[bestSheetName];
        // Read raw 2D array grid to guarantee accurate column index mapping
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (!rawGrid || rawGrid.length === 0) {
          throw new Error('File rỗng hoặc không chứa dòng dữ liệu nào.');
        }

        // Normalize 2D grid: if sheet was CSV with semicolon, pipe, or tab delimiters
        const normalizedGrid: any[][] = rawGrid.map((row) => {
          if (!Array.isArray(row)) return [];
          if (row.length === 1 && typeof row[0] === 'string') {
            const cell = row[0];
            if (cell.includes('\t')) return cell.split('\t');
            if (cell.includes('|')) return cell.split('|');
            if (cell.includes(';') && !cell.includes('&#')) return cell.split(';');
          }
          return row;
        });

        const isIndexHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s === 'stt' ||
            s === 'no' ||
            s === 'no.' ||
            s === '#' ||
            s === 'id' ||
            s === 'index' ||
            s.includes('thứ tự') ||
            s.includes('số tt')
          );
        };

        const isWordHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          if (isIndexHeader(s)) return false;
          if (s.includes('loại') || s.includes('nghĩa') || s.includes('dịch') || s.includes('ví dụ')) return false;
          return (
            s.includes('word') ||
            s.includes('từ') ||
            s.includes('vocab') ||
            s.includes('term') ||
            s.includes('chữ hán') ||
            s.includes('hán tự') ||
            s.includes('hanzi') ||
            s.includes('kanji') ||
            s.includes('hanja') ||
            s.includes('tiếng trung') ||
            s.includes('tiếng anh') ||
            s.includes('tiếng hàn') ||
            s.includes('tiếng nhật') ||
            s.includes('front') ||
            s.includes('entry') ||
            s.includes('text') ||
            s.includes('cụm từ') ||
            s.includes('thuật ngữ')
          );
        };

        const isPhoneticHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('phonetic') ||
            s.includes('phiên') ||
            s.includes('ipa') ||
            s.includes('pinyin') ||
            s.includes('bính âm') ||
            s.includes('phát âm') ||
            s.includes('pronunciation') ||
            s.includes('romaji') ||
            s.includes('chú âm') ||
            s.includes('furigana') ||
            s.includes('hangul')
          );
        };

        const isPosHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('part') ||
            s.includes('loại từ') ||
            s.includes('từ loại') ||
            s.includes('pos') ||
            s.includes('loại') ||
            s.includes('tính chất') ||
            s.includes('từ tính')
          );
        };

        const isMeaningHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('meaning') ||
            s.includes('nghĩa') ||
            s.includes('định nghĩa') ||
            s.includes('definition') ||
            s.includes('dịch') ||
            s.includes('ý nghĩa') ||
            s.includes('giải nghĩa') ||
            s.includes('giải thích') ||
            s.includes('tiếng việt') ||
            s.includes('vietnamese') ||
            s.includes('hán việt') ||
            s.includes('bản dịch') ||
            s.includes('translation') ||
            s.includes('explain') ||
            s.includes('back')
          );
        };

        const isExampleTransHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('example translation') ||
            s.includes('dịch ví dụ') ||
            s.includes('nghĩa ví dụ') ||
            s.includes('dịch câu') ||
            s.includes('nghĩa câu')
          );
        };

        const isExampleHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          if (isExampleTransHeader(s)) return false;
          return (
            s.includes('example') ||
            s.includes('ví dụ') ||
            s.includes('câu ví dụ') ||
            s.includes('câu mẫu') ||
            s.includes('sentence')
          );
        };

        const isCefrHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('cefr') ||
            s.includes('cấp độ') ||
            s.includes('trình độ') ||
            s.includes('level') ||
            s.includes('hsk') ||
            s.includes('jlpt') ||
            s.includes('toeic')
          );
        };

        const isTopicHeader = (h: string) => {
          const s = h.toLowerCase().trim();
          return (
            s.includes('topic') ||
            s.includes('chủ đề') ||
            s.includes('category') ||
            s.includes('lĩnh vực') ||
            s.includes('bài') ||
            s.includes('chuyên đề')
          );
        };

        // 1. Scan up to first 6 rows to locate the header row
        let headerRowIdx = -1;
        let colWord = -1;
        let colPhonetic = -1;
        let colPos = -1;
        let colMeaning = -1;
        let colExample = -1;
        let colExampleTrans = -1;
        let colCefr = -1;
        let colTopic = -1;

        for (let r = 0; r < Math.min(6, normalizedGrid.length); r++) {
          const row = normalizedGrid[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          let matchesCount = 0;
          let tempColWord = -1;
          let tempColPhonetic = -1;
          let tempColPos = -1;
          let tempColMeaning = -1;
          let tempColExample = -1;
          let tempColExampleTrans = -1;
          let tempColCefr = -1;
          let tempColTopic = -1;

          row.forEach((cellVal, cIdx) => {
            const h = String(cellVal || '').trim();
            if (!h) return;

            if (tempColExampleTrans === -1 && isExampleTransHeader(h)) {
              tempColExampleTrans = cIdx;
              matchesCount++;
            } else if (tempColExample === -1 && isExampleHeader(h)) {
              tempColExample = cIdx;
              matchesCount++;
            } else if (tempColPos === -1 && isPosHeader(h)) {
              tempColPos = cIdx;
              matchesCount++;
            } else if (tempColPhonetic === -1 && isPhoneticHeader(h)) {
              tempColPhonetic = cIdx;
              matchesCount++;
            } else if (tempColMeaning === -1 && isMeaningHeader(h)) {
              tempColMeaning = cIdx;
              matchesCount++;
            } else if (tempColWord === -1 && isWordHeader(h)) {
              tempColWord = cIdx;
              matchesCount++;
            } else if (tempColCefr === -1 && isCefrHeader(h)) {
              tempColCefr = cIdx;
              matchesCount++;
            } else if (tempColTopic === -1 && isTopicHeader(h)) {
              tempColTopic = cIdx;
              matchesCount++;
            }
          });

          if (matchesCount >= 2 || (tempColWord !== -1 && tempColMeaning !== -1)) {
            headerRowIdx = r;
            colWord = tempColWord;
            colPhonetic = tempColPhonetic;
            colPos = tempColPos;
            colMeaning = tempColMeaning;
            colExample = tempColExample;
            colExampleTrans = tempColExampleTrans;
            colCefr = tempColCefr;
            colTopic = tempColTopic;
            break;
          }
        }

        // If no explicit header row found, infer column positions:
        let startRowIdx = 0;
        if (headerRowIdx !== -1) {
          startRowIdx = headerRowIdx + 1;
        } else {
          // If first row column 0 is an index (e.g. "1", "STT")
          const firstRowCells = normalizedGrid[0] || [];
          const firstCell = String(firstRowCells[0] ?? '').trim();
          if (/^\d+$/.test(firstCell) || isIndexHeader(firstCell)) {
            colWord = 1;
            colMeaning = 2;
          } else {
            colWord = 0;
            colMeaning = 1;
          }
        }

        const parsedWords: ParsedWordItem[] = [];

        for (let r = startRowIdx; r < normalizedGrid.length; r++) {
          const row = normalizedGrid[r];
          if (!Array.isArray(row)) continue;

          const nonBlankCells = row
            .map((c) => String(c ?? '').trim())
            .filter((c) => c.length > 0);

          if (nonBlankCells.length === 0) continue;

          let word = colWord !== -1 ? String(row[colWord] ?? '').trim() : '';
          let meaning = colMeaning !== -1 ? String(row[colMeaning] ?? '').trim() : '';
          let phonetic = colPhonetic !== -1 ? String(row[colPhonetic] ?? '').trim() : '';
          let partOfSpeech = colPos !== -1 ? String(row[colPos] ?? '').trim() : 'noun';
          let example = colExample !== -1 ? String(row[colExample] ?? '').trim() : '';
          let exampleTranslation = colExampleTrans !== -1 ? String(row[colExampleTrans] ?? '').trim() : '';
          let cefrLevel = colCefr !== -1 ? String(row[colCefr] ?? '').trim() : 'B1';
          let topic = colTopic !== -1 ? String(row[colTopic] ?? '').trim() : 'General';

          if (!partOfSpeech) partOfSpeech = 'noun';

          // Fallback if word was missing but row has text (ignore index numbers)
          if (!word && nonBlankCells.length > 0) {
            if (/^\d+$/.test(nonBlankCells[0]) && nonBlankCells.length > 1) {
              word = nonBlankCells[1];
              if (!meaning && nonBlankCells.length > 2) {
                meaning = nonBlankCells[2];
              }
            } else {
              word = nonBlankCells[0];
              if (!meaning && nonBlankCells.length > 1) {
                meaning = nonBlankCells[1];
              }
            }
          } else if (/^\d+$/.test(word) && nonBlankCells.length > 1) {
            // Word was accidentally assigned an index number, extract real word from row
            const nonIndexCells = nonBlankCells.filter((c) => !/^\d+$/.test(c));
            if (nonIndexCells.length > 0) {
              word = nonIndexCells[0];
              if (!meaning || /^\d+$/.test(meaning) || meaning === word) {
                meaning = nonIndexCells.length > 1 ? nonIndexCells[1] : '';
              }
            }
          } else if (word && !meaning && nonBlankCells.length > 1) {
            const otherCell = nonBlankCells.find((c) => c !== word && !/^\d+$/.test(c));
            if (otherCell) meaning = otherCell;
          }

          // If meaning is still blank, default to word so the word is never discarded
          if (!meaning && word) {
            const fallbackMeaningCell = nonBlankCells.find(
              (c) => c !== word && !/^\d+$/.test(c) && c !== phonetic
            );
            meaning = fallbackMeaningCell || word;
          }

          // Don't drop rows with empty meaning! Keep the word so user can see and edit.
          if (!word && !meaning) continue;

          // Skip if row is an accidental duplicate header row
          if (
            (word.toLowerCase() === 'word' || word.toLowerCase() === 'từ vựng' || word.toLowerCase() === 'chữ hán') &&
            (meaning.toLowerCase() === 'meaning' || meaning.toLowerCase() === 'nghĩa')
          ) {
            continue;
          }

          parsedWords.push({
            word: word || meaning,
            phonetic: phonetic || undefined,
            partOfSpeech: partOfSpeech || 'noun',
            meaning: meaning || word,
            example: example || undefined,
            exampleTranslation: exampleTranslation || undefined,
            cefrLevel: cefrLevel || 'B1',
            topic: topic || 'General',
          });
        }

        if (parsedWords.length === 0) {
          throw new Error('File không chứa dữ liệu từ vựng hợp lệ.');
        }

        resolve(parsedWords);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file. Vui lòng thử lại.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Universal Export for Words / Decks to Excel (.xlsx) or CSV (.csv)
 * Uses the exact same 7 unified column headers as the import template.
 */
export const exportWordsToExcelOrCsv = (
  words: any[],
  filename: string = 'vocabflow_vocabulary_export',
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const exportData = words.map((w) => {
    const v = w.vocabulary || {};
    const wordText = v.word || w.word || '';
    const phoneticText = v.phonetic || w.phonetic || '';
    const posText = v.partOfSpeech || w.partOfSpeech || 'noun';
    const meaningText =
      v.meanings?.[0]?.meaning ||
      v.shortDefinition ||
      v.definition ||
      w.meaning ||
      '';
    const exampleText =
      v.examples?.[0]?.sentence || w.example || '';
    const cefrText = v.cefrLevel || w.cefrLevel || 'B1';
    const topicText = v.topic || w.topic || 'General';

    return {
      'Word (Từ tiếng Anh)': wordText,
      'Phonetic (Phiên âm)': phoneticText,
      'PartOfSpeech (Loại từ)': posText,
      'Meaning (Nghĩa tiếng Việt)': meaningText,
      'Example (Câu ví dụ)': exampleText,
      'CEFR (Trình độ)': cefrText,
      'Topic (Chủ đề)': topicText,
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
    { wch: 35 },
    { wch: 45 },
    { wch: 12 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary');

  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (format === 'csv') {
    XLSX.writeFile(wb, `${cleanFilename}.csv`, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, `${cleanFilename}.xlsx`, { bookType: 'xlsx' });
  }
};
