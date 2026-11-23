import * as XLSX from 'xlsx';

export interface ParsedExamOption {
  key: string;
  text: string;
}

export interface ParsedExamQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'SHORT_ANSWER';
  options: ParsedExamOption[];
  correctAnswer: any;
  acceptedAnswers: string[];
  explanation?: string;
  sourceExplanation?: string;
  optionExplanations?: Record<string, string>;
  grammarType?: string;
  partOfSpeech?: string;
  category?: string;
  skill?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  tags: string[];
  vocabularyIds?: string[];
  imageUrl?: string;
  audioUrl?: string;
  rowNumber?: number;
  warnings?: string[];
}

export interface InvalidExamQuestionRow {
  rowNumber: number;
  questionNumber?: number;
  questionText?: string;
  errors: string[];
  rawRow: any;
}

export interface ExcelExamParseResult {
  validQuestions: ParsedExamQuestion[];
  invalidQuestions: InvalidExamQuestionRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
}

export const SAMPLE_EXAM_DATA = [
  {
    cau_so: 1,
    noi_dung_cau_hoi: 'The manager _____ the annual financial report yesterday.',
    loai_cau_hoi: 'multiple_choice',
    lua_chon_a: 'complete',
    lua_chon_b: 'completed',
    lua_chon_c: 'completing',
    lua_chon_d: 'completion',
    dap_an_dung: 'B',
    giai_thich_chi_tiet: '"Yesterday" là trạng từ chỉ thời gian quá khứ đơn, vì vậy động từ phải chia thì quá khứ đơn "completed".',
    nguon_giai_thich: 'ETS TOEIC Official Test 2024 - Part 5',
    link_anh: '',
    link_audio: '',
    tai_sao_a_sai: 'complete là động từ nguyên mẫu, không phù hợp với ngữ cảnh quá khứ.',
    tai_sao_b_sai: 'Đáp án chính xác.',
    tai_sao_c_sai: 'completing là dạng V-ing/hiện tại phân từ, cần có trợ động từ to be.',
    tai_sao_d_sai: 'completion là danh từ (sự hoàn thành), vị trí này cần một vị ngữ/động từ chính.',
    chu_diem_ngu_phap: 'Past Simple',
    tu_loai: 'Verb',
    danh_muc: 'Grammar',
    ky_nang: 'Verb Tense',
    do_kho: 'medium',
    diem_so: 1.0,
    the_tags: 'toeic, grammar, part-5, past-simple',
    tu_vung_lien_quan: 'complete, annual, report',
  },
  {
    cau_so: 2,
    noi_dung_cau_hoi: 'Look at the picture. Where is the briefcase placed?',
    loai_cau_hoi: 'multiple_choice',
    lua_chon_a: 'Under the wooden desk',
    lua_chon_b: 'On top of the conference table',
    lua_chon_c: 'Next to the office window',
    lua_chon_d: 'Behind the swivel chair',
    dap_an_dung: 'B',
    giai_thich_chi_tiet: 'Bức ảnh hiển thị chiếc cặp được đặt ngay trên mặt bàn họp.',
    nguon_giai_thich: 'ETS TOEIC Part 1 Photo Analysis',
    link_anh: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    link_audio: 'https://actions.google.com/sounds/v1/ambiences/office_cubicle_large.ogg',
    tai_sao_a_sai: 'Không có vật nào dưới gầm bàn.',
    tai_sao_b_sai: 'Đáp án chính xác.',
    tai_sao_c_sai: 'Chiếc bàn ở trung tâm phòng, không sát cửa sổ.',
    tai_sao_d_sai: 'Không nằm phía sau ghế.',
    chu_diem_ngu_phap: 'Prepositions of Place',
    tu_loai: 'Preposition',
    danh_muc: 'Listening',
    ky_nang: 'Photographs Part 1',
    do_kho: 'easy',
    diem_so: 1.0,
    the_tags: 'part-1, photo, listening, office',
    tu_vung_lien_quan: 'briefcase, conference table',
  },
  {
    cau_so: 3,
    noi_dung_cau_hoi: 'The conference will take place at the Grand Convention Center.',
    loai_cau_hoi: 'true_false',
    lua_chon_a: 'True',
    lua_chon_b: 'False',
    lua_chon_c: '',
    lua_chon_d: '',
    dap_an_dung: 'True',
    giai_thich_chi_tiet: 'Thông tin trong bài xác nhận hội nghị diễn ra tại Grand Convention Center.',
    nguon_giai_thich: 'IELTS Reading Section 1',
    link_anh: '',
    link_audio: '',
    tai_sao_a_sai: 'Đáp án đúng.',
    tai_sao_b_sai: 'Sai vì thông tin đúng với thực tế bài đọc.',
    tai_sao_c_sai: '',
    tai_sao_d_sai: '',
    chu_diem_ngu_phap: 'Factual Understanding',
    tu_loai: '',
    danh_muc: 'Reading',
    ky_nang: 'Detail Finding',
    do_kho: 'easy',
    diem_so: 1.0,
    the_tags: 'reading, true-false',
    tu_vung_lien_quan: 'conference, take place',
  },
  {
    cau_so: 4,
    noi_dung_cau_hoi: 'The new mobile application allows customers to track their orders in real time.',
    loai_cau_hoi: 'fill_in_blank',
    lua_chon_a: '',
    lua_chon_b: '',
    lua_chon_c: '',
    lua_chon_d: '',
    dap_an_dung: 'allows',
    giai_thich_chi_tiet: 'Chủ ngữ số ít "The new mobile application" đi với động từ thêm "s/es" ở thì hiện tại đơn.',
    nguon_giai_thich: 'Business English Grammar Test',
    link_anh: '',
    link_audio: '',
    tai_sao_a_sai: '',
    tai_sao_b_sai: '',
    tai_sao_c_sai: '',
    tai_sao_d_sai: '',
    chu_diem_ngu_phap: 'Subject-Verb Agreement',
    tu_loai: 'Verb',
    danh_muc: 'Grammar',
    ky_nang: 'Present Simple',
    do_kho: 'medium',
    diem_so: 1.0,
    the_tags: 'fill-in, grammar',
    tu_vung_lien_quan: 'application, allow, track',
  },
];

const INSTRUCTIONS_DATA = [
  { Cột: 'cau_so', Ý_Nghĩa: 'Số thứ tự câu hỏi (Bắt buộc, số nguyên: 1, 2, 3...)', Ví_Dụ: '1' },
  { Cột: 'noi_dung_cau_hoi', Ý_Nghĩa: 'Nội dung đề bài câu hỏi (Bắt buộc)', Ví_Dụ: 'The manager _____ the report yesterday.' },
  { Cột: 'loai_cau_hoi', Ý_Nghĩa: 'multiple_choice | multiple_select | true_false | fill_in_blank | short_answer', Ví_Dụ: 'multiple_choice' },
  { Cột: 'lua_chon_a', Ý_Nghĩa: 'Lựa chọn phương án A (Bắt buộc với trắc nghiệm)', Ví_Dụ: 'complete' },
  { Cột: 'lua_chon_b', Ý_Nghĩa: 'Lựa chọn phương án B (Bắt buộc với trắc nghiệm)', Ví_Dụ: 'completed' },
  { Cột: 'lua_chon_c', Ý_Nghĩa: 'Lựa chọn phương án C (Tùy chọn)', Ví_Dụ: 'completing' },
  { Cột: 'lua_chon_d', Ý_Nghĩa: 'Lựa chọn phương án D (Tùy chọn)', Ví_Dụ: 'completion' },
  { Cột: 'dap_an_dung', Ý_Nghĩa: 'Ký tự đáp án đúng (A, B, C, D hoặc nội dung với điền từ)', Ví_Dụ: 'B' },
  { Cột: 'link_anh', Ý_Nghĩa: 'Link URL hình ảnh trực tiếp (Khuyên dùng link online để không tốn dung lượng)', Ví_Dụ: 'https://example.com/photo.jpg' },
  { Cột: 'link_audio', Ý_Nghĩa: 'Link URL âm thanh trực tiếp (Khuyên dùng link MP3 online)', Ví_Dụ: 'https://example.com/audio.mp3' },
  { Cột: 'giai_thich_chi_tiet', Ý_Nghĩa: 'Lời giải thích vì sao đáp án đúng (Khuyến khích)', Ví_Dụ: 'Yesterday là dấu hiệu thì quá khứ đơn...' },
  { Cột: 'nguon_giai_thich', Ý_Nghĩa: 'Tên tài liệu / Giáo trình nguồn của câu hỏi', Ví_Dụ: 'ETS TOEIC Official Test' },
  { Cột: 'tai_sao_a_sai', Ý_Nghĩa: 'Giải thích lý do phương án A sai (Tùy chọn)', Ví_Dụ: 'Sai vì là động từ nguyên mẫu' },
  { Cột: 'tai_sao_b_sai', Ý_Nghĩa: 'Giải thích lý do phương án B sai (hoặc "Đáp án đúng")', Ví_Dụ: 'Đáp án chính xác' },
  { Cột: 'tai_sao_c_sai', Ý_Nghĩa: 'Giải thích lý do phương án C sai (Tùy chọn)', Ví_Dụ: 'Sai dạng V-ing' },
  { Cột: 'tai_sao_d_sai', Ý_Nghĩa: 'Giải thích lý do phương án D sai (Tùy chọn)', Ví_Dụ: 'Sai vì là danh từ' },
  { Cột: 'chu_diem_ngu_phap', Ý_Nghĩa: 'Chủ điểm ngữ pháp (để phân tích lỗi học viên)', Ví_Dụ: 'Past Simple' },
  { Cột: 'tu_loai', Ý_Nghĩa: 'Từ loại: Verb, Noun, Adjective, Preposition...', Ví_Dụ: 'Verb' },
  { Cột: 'danh_muc', Ý_Nghĩa: 'Grammar | Vocabulary | Reading | Listening | Pronunciation', Ví_Dụ: 'Grammar' },
  { Cột: 'ky_nang', Ý_Nghĩa: 'Kỹ năng đánh giá cụ thể', Ví_Dụ: 'Verb Tense' },
  { Cột: 'do_kho', Ý_Nghĩa: 'easy | medium | hard', Ví_Dụ: 'medium' },
  { Cột: 'diem_so', Ý_Nghĩa: 'Điểm số của câu hỏi (mặc định: 1.0)', Ví_Dụ: '1.0' },
  { Cột: 'the_tags', Ý_Nghĩa: 'Từ khóa phân loại (phân cách bằng dấu phẩy)', Ví_Dụ: 'toeic, grammar, part-5' },
  { Cột: 'tu_vung_lien_quan', Ý_Nghĩa: 'Các từ vựng trọng tâm (để kết nối sang Kho từ vựng)', Ví_Dụ: 'complete, annual' },
];

export const downloadExamExcelTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Mau_De_Thi
  const wsExam = XLSX.utils.json_to_sheet(SAMPLE_EXAM_DATA);
  XLSX.utils.book_append_sheet(wb, wsExam, 'Mau_De_Thi');

  // Sheet 2: Huong_Dan
  const wsGuide = XLSX.utils.json_to_sheet(INSTRUCTIONS_DATA);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Huong_Dan_Nhap_De');

  const filename = `vocabflow_mau_nhap_bo_de_thi.${format}`;
  XLSX.writeFile(wb, filename, { bookType: format });
};

export const downloadExamCsvTemplate = () => {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_EXAM_DATA);
  const csvContent = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocabflow_mau_nhap_bo_de_thi.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadExamJsonTemplate = () => {
  const jsonContent = JSON.stringify(
    {
      title: 'Bộ Đề Thi Mẫu Chuẩn VocabFlow AI',
      description: 'Mẫu đề thi định dạng JSON chuẩn quốc tế hỗ trợ link ảnh & link audio trực tiếp',
      examType: 'TOEIC',
      durationMinutes: 60,
      passingScore: 50,
      questions: SAMPLE_EXAM_DATA.map((q) => ({
        questionNumber: q.cau_so,
        questionText: q.noi_dung_cau_hoi,
        questionType: q.loai_cau_hoi === 'multiple_choice' ? 'MULTIPLE_CHOICE' : q.loai_cau_hoi.toUpperCase(),
        options: [
          q.lua_chon_a ? { key: 'A', text: q.lua_chon_a } : null,
          q.lua_chon_b ? { key: 'B', text: q.lua_chon_b } : null,
          q.lua_chon_c ? { key: 'C', text: q.lua_chon_c } : null,
          q.lua_chon_d ? { key: 'D', text: q.lua_chon_d } : null,
        ].filter(Boolean),
        correctAnswer: q.dap_an_dung,
        explanation: q.giai_thich_chi_tiet,
        imageUrl: q.link_anh || undefined,
        audioUrl: q.link_audio || undefined,
        difficulty: q.do_kho.toUpperCase(),
        points: q.diem_so,
        tags: q.the_tags.split(',').map((t) => t.trim()),
      })),
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocabflow_mau_nhap_bo_de_thi.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadExamWordTemplate = () => {
  const sampleDocText = `=== HƯỚNG DẪN CÀO ĐỀ THI TỰ ĐỘNG VOCABFLOW AI ===
Bạn có thể soạn đề thi tự do trên Word hoặc văn bản thô theo cấu trúc dưới đây.
Hệ thống tự động nhận diện câu hỏi, các phương án A/B/C/D, đáp án đúng, giải thích và link ảnh/âm thanh.

Câu 1: The manager _____ the annual financial report yesterday.
A. complete
B. completed
C. completing
D. completion
Đáp án: B
Giải thích: "Yesterday" là trạng từ chỉ thời gian quá khứ đơn, vì vậy động từ phải chia thì quá khứ đơn "completed".
[Ảnh: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800]
[Audio: https://actions.google.com/sounds/v1/office/typing_on_keyboard.ogg]

Câu 2: All participants must register _____ Friday to receive the early-bird discount.
A) before
B) between
C) during
D) under
Đáp án: A
Giải thích: Cần giới từ chỉ mốc thời gian hạn chót "trước thứ Sáu" -> "before Friday".

Câu 3: The conference will take place at the Grand Convention Center.
A. True
B. False
Đáp án: A
Giải thích: Thông tin trong bài xác nhận hội nghị diễn ra tại Grand Convention Center.

Câu 4: What is the primary purpose of the memo?
(A) To announce a new corporate policy
*(B) To schedule an executive board meeting
(C) To introduce a newly hired marketing director
(D) To request financial approval for equipment
Giải thích: Dấu sao (*) ở đầu phương án B tự động được hiểu là đáp án đúng!
`;

  const blob = new Blob([sampleDocText], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocabflow_mau_de_thi_word.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Super Flexible Raw Text Exam Parser ("Cào Đề Thi Tự Động")
 * Parses plain text copied from Word, Web, PDF, Telegram, etc.
 */
export const parseAndValidateRawText = (rawText: string): ExcelExamParseResult => {
  if (!rawText || !rawText.trim()) {
    return {
      validQuestions: [],
      invalidQuestions: [
        {
          rowNumber: 1,
          errors: ['Văn bản trống. Vui lòng dán nội dung đề thi cần cào.'],
          rawRow: {},
        },
      ],
      totalRows: 0,
      validCount: 0,
      invalidCount: 1,
      warningCount: 0,
    };
  }

  // Split into question blocks: match lines starting with "Câu X", "Question X", "Q X", or numbers like "1."
  const splitRegex = /(?=(?:^|\n)\s*(?:(?:Câu|Question|Q|Bài)\s*\d+[\.\:\-\/\)]|\b\d+[\.\:\-\/\)]\s+))/i;
  let rawBlocks = rawText.split(splitRegex).map((b) => b.trim()).filter(Boolean);

  // Fallback: If no "Câu X" prefix detected, try splitting by double newline
  if (rawBlocks.length <= 1 && rawText.includes('\n\n')) {
    rawBlocks = rawText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  }

  const validQuestions: ParsedExamQuestion[] = [];
  const invalidQuestions: InvalidExamQuestionRow[] = [];

  rawBlocks.forEach((block, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];
    let text = block;

    // Detect question number if present
    const qNumMatch = text.match(/^(?:(?:Câu|Question|Q|Bài)\s*(\d+)[\.\:\-\/\)]|(\d+)[\.\:\-\/\)])\s*/i);
    const questionNumber = qNumMatch ? parseInt(qNumMatch[1] || qNumMatch[2], 10) : idx + 1;

    // Strip question number header from prompt text
    if (qNumMatch) {
      text = text.replace(qNumMatch[0], '');
    }

    // 1. Extract Image URL: [Ảnh: https://...] or Ảnh: https://...
    const imgMatch = text.match(/(?:\[?(?:Ảnh|Image|Hình|img|Picture)\s*[\:\=]?\s*(https?:\/\/[^\s\]\)\"\'\>]+)\]?)/i);
    const imageUrl = imgMatch ? imgMatch[1] : undefined;
    if (imgMatch) {
      text = text.replace(imgMatch[0], '');
    }

    // 2. Extract Audio URL: [Audio: https://...] or Audio: https://...
    const audMatch = text.match(/(?:\[?(?:Audio|Âm\s*thanh|Nghe|Sound|Listening)\s*[\:\=]?\s*(https?:\/\/[^\s\]\)\"\'\>]+)\]?)/i);
    const audioUrl = audMatch ? audMatch[1] : undefined;
    if (audMatch) {
      text = text.replace(audMatch[0], '');
    }

    // 3. Extract Explanation: "Giải thích: ..." or "Explanation: ..."
    const expMatch = text.match(/(?:Giải\s*thích|Explanation|Hướng\s*dẫn|Lý\s*do|Ghi\s*chú)\s*[\:\=\-]?\s*([\s\S]+?)(?=(?:\[?(?:Ảnh|Audio|Câu|Question|\d+[\.\:])|$))/i);
    const explanation = expMatch ? expMatch[1].trim() : undefined;
    if (expMatch) {
      text = text.replace(expMatch[0], '');
    }

    // 4. Extract Answer: "Đáp án: B" or "Key: A"
    const ansMatch = text.match(/(?:Đáp\s*án|Đ\/a|Answer|Key|ĐA|Correct)\s*[\:\=\-]?\s*([A-Fa-f]|True|False|[^\n\r]+)/i);
    let correctAnswer = ansMatch ? ansMatch[1].trim() : undefined;
    if (ansMatch) {
      text = text.replace(ansMatch[0], '');
    }

    // 5. Extract Options: A. / A) / [A] / (A) or with asterisk *A.
    const options: ParsedExamOption[] = [];
    const optRegex = /(?:^|\n)\s*(?:\(?\*?([A-Fa-f])[\.\)\:\-\]]|\(([A-Fa-f])\))\s*([^\n\r]+)/g;
    let m;
    while ((m = optRegex.exec(text)) !== null) {
      const key = (m[1] || m[2]).toUpperCase();
      const isAsterisk = m[0].includes('*');
      if (isAsterisk && !correctAnswer) {
        correctAnswer = key;
      }
      options.push({ key, text: m[3].trim() });
    }

    // 6. Question Prompt is the text before the first option starts
    const firstOptIdx = text.search(/(?:^|\n)\s*(?:\(?\*?[A-Fa-f][\.\)\:\-\]]|\([A-Fa-f]\))/);
    let questionText = (firstOptIdx !== -1 ? text.substring(0, firstOptIdx) : text).trim();

    // Clean remaining markup or tags
    questionText = questionText.replace(/\s+/g, ' ').trim();

    if (!questionText) {
      errors.push('Không nhận diện được nội dung đề bài câu hỏi.');
    }

    // Determine Question Type
    let questionType: ParsedExamQuestion['questionType'] = 'MULTIPLE_CHOICE';
    if (options.length === 2 && options.some((o) => o.text.toLowerCase() === 'true' || o.text.toLowerCase() === 'false')) {
      questionType = 'TRUE_FALSE';
    } else if (options.length === 0) {
      questionType = 'FILL_IN_BLANK';
    }

    // Default correct answer fallback
    if (!correctAnswer) {
      if (options.length > 0) {
        correctAnswer = 'A'; // fallback with warning
      } else {
        correctAnswer = '';
      }
    }

    if (errors.length > 0) {
      invalidQuestions.push({
        rowNumber,
        questionNumber,
        questionText: questionText || block.slice(0, 50),
        errors,
        rawRow: { text: block },
      });
    } else {
      const warnings: string[] = [];
      if (!explanation) warnings.push('Chưa có lời giải thích chi tiết.');
      if (!ansMatch && !block.includes('*')) warnings.push('Tự động gán đáp án mặc định (chưa phát hiện dòng Đáp án).');

      validQuestions.push({
        rowNumber,
        questionNumber,
        questionText,
        questionType,
        options,
        correctAnswer: correctAnswer.toUpperCase(),
        acceptedAnswers: [correctAnswer],
        explanation,
        imageUrl,
        audioUrl,
        difficulty: 'MEDIUM',
        points: 1.0,
        tags: ['imported', 'text-crawl'],
        warnings,
      });
    }
  });

  const warningCount = validQuestions.filter((q) => q.warnings && q.warnings.length > 0).length;

  return {
    validQuestions,
    invalidQuestions,
    totalRows: rawBlocks.length,
    validCount: validQuestions.length,
    invalidCount: invalidQuestions.length,
    warningCount,
  };
};

/**
 * Word (.docx) Exam Parser using dynamic mammoth import
 */
export const parseAndValidateExamWord = async (file: File): Promise<ExcelExamParseResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import to comply with bundle size standards (AGENTS.md)
    const mammothModule = (await import('mammoth')).default || (await import('mammoth'));
    const result = await mammothModule.extractRawText({ arrayBuffer });
    const rawText = result?.value || '';

    if (!rawText.trim()) {
      return {
        validQuestions: [],
        invalidQuestions: [
          {
            rowNumber: 1,
            errors: ['Tệp Word (.docx) trống hoặc không chứa văn bản.'],
            rawRow: {},
          },
        ],
        totalRows: 0,
        validCount: 0,
        invalidCount: 1,
        warningCount: 0,
      };
    }

    return parseAndValidateRawText(rawText);
  } catch (err: any) {
    throw new Error(`Lỗi đọc tệp Word (.docx): ${err?.message || 'Định dạng tài liệu không hợp lệ.'}`);
  }
};

/**
 * JSON Exam Parser
 */
export const parseAndValidateExamJson = async (file: File): Promise<ExcelExamParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Normalize data: supports array of questions, or { questions: [...] }, or { data: [...] }
        const rawList: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.questions)
          ? parsed.questions
          : Array.isArray(parsed.data)
          ? parsed.data
          : [];

        if (!rawList || rawList.length === 0) {
          resolve({
            validQuestions: [],
            invalidQuestions: [
              {
                rowNumber: 1,
                errors: ['File JSON không chứa danh sách câu hỏi hợp lệ (cần mảng questions hoặc [ ... ]).'],
                rawRow: parsed,
              },
            ],
            totalRows: 0,
            validCount: 0,
            invalidCount: 1,
            warningCount: 0,
          });
          return;
        }

        const validQuestions: ParsedExamQuestion[] = [];
        const invalidQuestions: InvalidExamQuestionRow[] = [];

        rawList.forEach((item, idx) => {
          const rowNumber = idx + 1;
          const errors: string[] = [];

          const qNum = Number(item.questionNumber || item.cau_so || item.number || idx + 1);
          const qText = String(item.questionText || item.noi_dung_cau_hoi || item.prompt || '').trim();

          if (!qText) {
            errors.push('Nội dung câu hỏi (questionText) không được để trống.');
          }

          // Options normalization
          let options: ParsedExamOption[] = [];
          if (Array.isArray(item.options)) {
            options = item.options.map((o: any, oIdx: number) => {
              if (typeof o === 'string') {
                return { key: String.fromCharCode(65 + oIdx), text: o };
              }
              return { key: o.key || String.fromCharCode(65 + oIdx), text: o.text || '' };
            });
          } else if (item.lua_chon_a || item.option_a) {
            if (item.lua_chon_a || item.option_a) options.push({ key: 'A', text: item.lua_chon_a || item.option_a });
            if (item.lua_chon_b || item.option_b) options.push({ key: 'B', text: item.lua_chon_b || item.option_b });
            if (item.lua_chon_c || item.option_c) options.push({ key: 'C', text: item.lua_chon_c || item.option_c });
            if (item.lua_chon_d || item.option_d) options.push({ key: 'D', text: item.lua_chon_d || item.option_d });
          }

          const correctAnswer = String(item.correctAnswer || item.dap_an_dung || item.answer || 'A').trim();
          const imageUrl = item.imageUrl || item.link_anh || item.image || undefined;
          const audioUrl = item.audioUrl || item.link_audio || item.audio || undefined;

          if (errors.length > 0) {
            invalidQuestions.push({
              rowNumber,
              questionNumber: qNum,
              questionText: qText || `Câu ${rowNumber}`,
              errors,
              rawRow: item,
            });
          } else {
            validQuestions.push({
              rowNumber,
              questionNumber: qNum,
              questionText: qText,
              questionType: item.questionType || 'MULTIPLE_CHOICE',
              options,
              correctAnswer: correctAnswer.toUpperCase(),
              acceptedAnswers: [correctAnswer],
              explanation: item.explanation || item.giai_thich_chi_tiet || undefined,
              imageUrl,
              audioUrl,
              difficulty: (item.difficulty || 'MEDIUM').toUpperCase(),
              points: Number(item.points) || 1.0,
              tags: Array.isArray(item.tags) ? item.tags : ['json-import'],
              warnings: [],
            });
          }
        });

        resolve({
          validQuestions,
          invalidQuestions,
          totalRows: rawList.length,
          validCount: validQuestions.length,
          invalidCount: invalidQuestions.length,
          warningCount: 0,
        });
      } catch (err: any) {
        reject(new Error(`Lỗi cú pháp file JSON: ${err?.message || 'Không thể phân tích JSON'}`));
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file JSON.'));
    reader.readAsText(file);
  });
};

/**
 * Excel & CSV Exam Parser (Enhanced with image and audio link detection)
 */
export const parseAndValidateExamExcel = async (file: File): Promise<ExcelExamParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find sheet with exam data
        const sheetName =
          workbook.SheetNames.find(
            (s) => s.toLowerCase().includes('de_thi') || s.toLowerCase().includes('exam')
          ) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawData || rawData.length === 0) {
          resolve({
            validQuestions: [],
            invalidQuestions: [
              { rowNumber: 1, errors: ['File Excel trống hoặc không có dòng dữ liệu hợp lệ.'], rawRow: {} },
            ],
            totalRows: 0,
            validCount: 0,
            invalidCount: 1,
            warningCount: 0,
          });
          return;
        }

        const validQuestions: ParsedExamQuestion[] = [];
        const invalidQuestions: InvalidExamQuestionRow[] = [];
        const seenQuestionNumbers = new Set<number>();

        rawData.forEach((row, idx) => {
          const rowNumber = idx + 2; // Row in Excel (header is row 1)
          const errors: string[] = [];

          // Clean key mappings
          const cleanKey = (k: string) => k.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
          const cleanRow: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            cleanRow[cleanKey(key)] = typeof row[key] === 'string' ? row[key].trim() : row[key];
          }

          const qNumRaw = cleanRow.cau_so || cleanRow.question_number || cleanRow.stt || idx + 1;
          const qNum = parseInt(String(qNumRaw), 10);
          if (isNaN(qNum) || qNum <= 0) {
            errors.push('Số thứ tự câu (cau_so) phải là số nguyên dương.');
          } else if (seenQuestionNumbers.has(qNum)) {
            errors.push(`Số thứ tự câu ${qNum} bị trùng lặp.`);
          } else {
            seenQuestionNumbers.add(qNum);
          }

          const qText = cleanRow.noi_dung_cau_hoi || cleanRow.question || cleanRow.cau_hoi || cleanRow.prompt || '';
          if (!qText) {
            errors.push('Nội dung câu hỏi (noi_dung_cau_hoi) không được để trống.');
          }

          const rawType = (cleanRow.loai_cau_hoi || cleanRow.question_type || 'multiple_choice').toLowerCase();
          let questionType: ParsedExamQuestion['questionType'] = 'MULTIPLE_CHOICE';
          if (rawType.includes('multi') && rawType.includes('select')) questionType = 'MULTIPLE_SELECT';
          else if (rawType.includes('true') || rawType.includes('false')) questionType = 'TRUE_FALSE';
          else if (rawType.includes('fill') || rawType.includes('dien')) questionType = 'FILL_IN_BLANK';
          else if (rawType.includes('short')) questionType = 'SHORT_ANSWER';

          const optA = String(cleanRow.lua_chon_a || cleanRow.option_a || cleanRow.a || '').trim();
          const optB = String(cleanRow.lua_chon_b || cleanRow.option_b || cleanRow.b || '').trim();
          const optC = String(cleanRow.lua_chon_c || cleanRow.option_c || cleanRow.c || '').trim();
          const optD = String(cleanRow.lua_chon_d || cleanRow.option_d || cleanRow.d || '').trim();

          const options: ParsedExamOption[] = [];
          if (optA) options.push({ key: 'A', text: optA });
          if (optB) options.push({ key: 'B', text: optB });
          if (optC) options.push({ key: 'C', text: optC });
          if (optD) options.push({ key: 'D', text: optD });

          if ((questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTIPLE_SELECT') && options.length < 2) {
            errors.push('Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn (A và B).');
          }

          const correctAns = String(cleanRow.dap_an_dung || cleanRow.correct_answer || cleanRow.dap_an || '').trim();
          if (!correctAns) {
            errors.push('Đáp án đúng (dap_an_dung) không được để trống.');
          } else if (questionType === 'MULTIPLE_CHOICE') {
            const validKeys = options.map((o) => o.key.toUpperCase());
            if (!validKeys.includes(correctAns.toUpperCase())) {
              errors.push(`Đáp án đúng "${correctAns}" không nằm trong các lựa chọn có sẵn (${validKeys.join(', ')}).`);
            }
          }

          const rawDiff = String(cleanRow.do_kho || cleanRow.difficulty || 'medium').toLowerCase();
          let difficulty: ParsedExamQuestion['difficulty'] = 'MEDIUM';
          if (rawDiff.includes('de') || rawDiff.includes('easy')) difficulty = 'EASY';
          else if (rawDiff.includes('kho') || rawDiff.includes('hard')) difficulty = 'HARD';

          const ptsRaw = parseFloat(cleanRow.diem_so || cleanRow.points || '1.0');
          const points = isNaN(ptsRaw) || ptsRaw <= 0 ? 1.0 : ptsRaw;

          const tags = cleanRow.the_tags || cleanRow.tags
            ? String(cleanRow.the_tags || cleanRow.tags).split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
            : [];

          const vocabTerms = cleanRow.tu_vung_lien_quan || cleanRow.vocabulary
            ? String(cleanRow.tu_vung_lien_quan || cleanRow.vocabulary).split(',').map((v: string) => v.trim()).filter(Boolean)
            : [];

          // Image & Audio link detection
          const imageUrl = cleanRow.link_anh || cleanRow.image_url || cleanRow.hinh_anh || cleanRow.image || cleanRow.img || undefined;
          const audioUrl = cleanRow.link_audio || cleanRow.audio_url || cleanRow.am_thanh || cleanRow.audio || cleanRow.sound || undefined;

          // Option explanations
          const optionExplanations: Record<string, string> = {};
          if (cleanRow.tai_sao_a_sai) optionExplanations['A'] = String(cleanRow.tai_sao_a_sai);
          if (cleanRow.tai_sao_b_sai) optionExplanations['B'] = String(cleanRow.tai_sao_b_sai);
          if (cleanRow.tai_sao_c_sai) optionExplanations['C'] = String(cleanRow.tai_sao_c_sai);
          if (cleanRow.tai_sao_d_sai) optionExplanations['D'] = String(cleanRow.tai_sao_d_sai);

          // Warnings (Non-fatal, can still import)
          const warnings: string[] = [];
          if (!cleanRow.giai_thich_chi_tiet && !cleanRow.explanation) {
            warnings.push('Thiếu giải thích chi tiết.');
          }
          if (!cleanRow.chu_diem_ngu_phap && !cleanRow.grammar_type) {
            warnings.push('Chưa gắn chủ điểm ngữ pháp.');
          }
          if (questionType === 'MULTIPLE_CHOICE' && options.length < 4) {
            warnings.push(`Chỉ có ${options.length} phương án lựa chọn.`);
          }

          if (errors.length > 0) {
            invalidQuestions.push({
              rowNumber,
              questionNumber: qNum,
              questionText: qText,
              errors,
              rawRow: row,
            });
          } else {
            validQuestions.push({
              rowNumber,
              questionNumber: qNum,
              questionText: qText,
              questionType,
              options,
              correctAnswer: questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE' ? correctAns.toUpperCase() : correctAns,
              acceptedAnswers: questionType === 'FILL_IN_BLANK' || questionType === 'SHORT_ANSWER' ? [correctAns] : [],
              explanation: cleanRow.giai_thich_chi_tiet || cleanRow.explanation || undefined,
              sourceExplanation: cleanRow.nguon_giai_thich || cleanRow.source_explanation || undefined,
              optionExplanations: Object.keys(optionExplanations).length > 0 ? optionExplanations : undefined,
              grammarType: cleanRow.chu_diem_ngu_phap || cleanRow.grammar_type || undefined,
              partOfSpeech: cleanRow.tu_loai || cleanRow.part_of_speech || undefined,
              category: cleanRow.danh_muc || cleanRow.category || 'Grammar',
              skill: cleanRow.ky_nang || cleanRow.skill || 'Reading',
              difficulty,
              points,
              tags,
              vocabularyIds: vocabTerms,
              imageUrl,
              audioUrl,
              warnings,
            });
          }
        });

        const warningCount = validQuestions.filter((q) => q.warnings && q.warnings.length > 0).length;

        resolve({
          validQuestions,
          invalidQuestions,
          totalRows: rawData.length,
          validCount: validQuestions.length,
          invalidCount: invalidQuestions.length,
          warningCount,
        });
      } catch (err: any) {
        reject(new Error(`Lỗi xử lý file: ${err?.message || 'Định dạng file không hợp lệ'}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file được chọn.'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportExamToExcel = (exam: any, customFilename?: string) => {
  const rows = (exam.questions || []).map((q: any, idx: number) => {
    const optMap: Record<string, string> = {};
    (q.options || []).forEach((opt: any) => {
      optMap[opt.key] = opt.text;
    });

    const optExp = q.optionExplanations || {};

    return {
      cau_so: q.questionNumber || idx + 1,
      noi_dung_cau_hoi: q.questionText,
      loai_cau_hoi: q.questionType,
      lua_chon_a: optMap['A'] || '',
      lua_chon_b: optMap['B'] || '',
      lua_chon_c: optMap['C'] || '',
      lua_chon_d: optMap['D'] || '',
      dap_an_dung: Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer || ''),
      link_anh: q.imageUrl || '',
      link_audio: q.audioUrl || '',
      giai_thich_chi_tiet: q.explanation || '',
      nguon_giai_thich: q.sourceExplanation || '',
      tai_sao_a_sai: optExp['A'] || '',
      tai_sao_b_sai: optExp['B'] || '',
      tai_sao_c_sai: optExp['C'] || '',
      tai_sao_d_sai: optExp['D'] || '',
      chu_diem_ngu_phap: q.grammarType || '',
      tu_loai: q.partOfSpeech || '',
      danh_muc: q.category || '',
      ky_nang: q.skill || '',
      do_kho: q.difficulty || '',
      diem_so: q.points || 1.0,
      the_tags: Array.isArray(q.tags) ? q.tags.join(', ') : '',
      tu_vung_lien_quan: Array.isArray(q.vocabularyIds) ? q.vocabularyIds.join(', ') : '',
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'De_Thi');

  const safeTitle = (customFilename || exam.title || 'bo_de_thi')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/gi, '_');

  XLSX.writeFile(wb, `${safeTitle}.xlsx`, { bookType: 'xlsx' });
};
