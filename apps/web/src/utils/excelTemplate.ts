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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawData || rawData.length === 0) {
          throw new Error('File không chứa dòng dữ liệu nào.');
        }

        const parsedWords: ParsedWordItem[] = [];

        for (const row of rawData) {
          // Normalize row keys to match various header namings
          const keys = Object.keys(row);
          let word = '';
          let phonetic = '';
          let partOfSpeech = 'noun';
          let meaning = '';
          let example = '';
          let cefrLevel = 'B1';
          let topic = 'General';

          for (const key of keys) {
            const lowerKey = key.toLowerCase().trim();
            const val = String(row[key] || '').trim();

            if (lowerKey.includes('word') || lowerKey.includes('từ')) {
              word = val;
            } else if (lowerKey.includes('phonetic') || lowerKey.includes('phiên') || lowerKey.includes('ipa')) {
              phonetic = val;
            } else if (lowerKey.includes('part') || lowerKey.includes('loại') || lowerKey.includes('pos')) {
              partOfSpeech = val;
            } else if (lowerKey.includes('meaning') || lowerKey.includes('nghĩa') || lowerKey.includes('định nghĩa')) {
              meaning = val;
            } else if (lowerKey.includes('example') || lowerKey.includes('ví dụ') || lowerKey.includes('sentence')) {
              example = val;
            } else if (lowerKey.includes('cefr') || lowerKey.includes('cấp độ') || lowerKey.includes('level')) {
              cefrLevel = val;
            } else if (lowerKey.includes('topic') || lowerKey.includes('chủ đề') || lowerKey.includes('chủ de')) {
              topic = val;
            }
          }

          if (word && meaning) {
            parsedWords.push({
              word,
              phonetic: phonetic || undefined,
              partOfSpeech: partOfSpeech || 'noun',
              meaning,
              example: example || undefined,
              cefrLevel: cefrLevel || 'B1',
              topic: topic || 'General',
            });
          }
        }

        if (parsedWords.length === 0) {
          throw new Error('Không tìm thấy từ vựng hợp lệ. Hãy kiểm tra các cột Word và Meaning.');
        }

        resolve(parsedWords);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file.'));
    };

    reader.readAsBinaryString(file);
  });
};
