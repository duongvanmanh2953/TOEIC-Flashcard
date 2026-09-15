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
    throw new Error(`File vượt quá dung lượng tối đa 100MB (Kích thước file: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn file nhỏ hơn.`);
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
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('File Excel/CSV không có worksheet nào.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawData || rawData.length === 0) {
          throw new Error('File rỗng hoặc không chứa dòng dữ liệu nào.');
        }

        const parsedWords: ParsedWordItem[] = [];

        for (const row of rawData) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;

          let word = '';
          let phonetic = '';
          let partOfSpeech = 'noun';
          let meaning = '';
          let example = '';
          let exampleTranslation = '';
          let cefrLevel = 'B1';
          let topic = 'General';

          let hasMatchedKeys = false;

          for (const key of keys) {
            const lowerKey = key.toLowerCase().trim();
            const val = String(row[key] || '').trim();
            if (!val) continue;

            if (
              lowerKey.includes('word') ||
              lowerKey.includes('từ') ||
              lowerKey.includes('vocab') ||
              lowerKey.includes('term') ||
              lowerKey.includes('tiếng anh') ||
              lowerKey.includes('english')
            ) {
              word = val;
              hasMatchedKeys = true;
            } else if (
              lowerKey.includes('phonetic') ||
              lowerKey.includes('phiên') ||
              lowerKey.includes('ipa') ||
              lowerKey.includes('pronunciation')
            ) {
              phonetic = val;
            } else if (
              lowerKey.includes('part') ||
              lowerKey.includes('loại') ||
              lowerKey.includes('pos') ||
              lowerKey.includes('type')
            ) {
              partOfSpeech = val;
            } else if (
              lowerKey.includes('meaning') ||
              lowerKey.includes('nghĩa') ||
              lowerKey.includes('định nghĩa') ||
              lowerKey.includes('definition') ||
              lowerKey.includes('translation') ||
              lowerKey.includes('tiếng việt') ||
              lowerKey.includes('vietnamese')
            ) {
              meaning = val;
              hasMatchedKeys = true;
            } else if (
              lowerKey.includes('example translation') ||
              lowerKey.includes('dịch ví dụ') ||
              lowerKey.includes('nghĩa ví dụ')
            ) {
              exampleTranslation = val;
            } else if (
              lowerKey.includes('example') ||
              lowerKey.includes('ví dụ') ||
              lowerKey.includes('sentence')
            ) {
              example = val;
            } else if (
              lowerKey.includes('cefr') ||
              lowerKey.includes('cấp độ') ||
              lowerKey.includes('level') ||
              lowerKey.includes('trình độ')
            ) {
              cefrLevel = val;
            } else if (
              lowerKey.includes('topic') ||
              lowerKey.includes('chủ đề') ||
              lowerKey.includes('category')
            ) {
              topic = val;
            }
          }

          // Fallback parsing if headers couldn't be matched by keywords
          if (!hasMatchedKeys || !word || !meaning) {
            const nonArrayValues = keys
              .map((k) => String(row[k] || '').trim())
              .filter((v) => v.length > 0);

            if (nonArrayValues.length >= 2) {
              word = word || nonArrayValues[0];
              meaning = meaning || nonArrayValues[1];
            }
          }

          if (word && meaning && word.toLowerCase() !== 'word' && word.toLowerCase() !== 'từ tiếng anh') {
            parsedWords.push({
              word,
              phonetic: phonetic || undefined,
              partOfSpeech: partOfSpeech || 'noun',
              meaning,
              example: example || undefined,
              exampleTranslation: exampleTranslation || undefined,
              cefrLevel: cefrLevel || 'B1',
              topic: topic || 'General',
            });
          }
        }

        if (parsedWords.length === 0) {
          throw new Error('Cấu trúc file không đúng định dạng. Cần có tối thiểu 2 cột chứa Từ tiếng Anh (Word) và Nghĩa tiếng Việt (Meaning).');
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
