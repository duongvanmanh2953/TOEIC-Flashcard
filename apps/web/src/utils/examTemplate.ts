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

const SAMPLE_EXAM_DATA = [
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
    noi_dung_cau_hoi: 'All participants must register _____ Friday to receive the early-bird discount.',
    loai_cau_hoi: 'multiple_choice',
    lua_chon_a: 'before',
    lua_chon_b: 'between',
    lua_chon_c: 'during',
    lua_chon_d: 'under',
    dap_an_dung: 'A',
    giai_thich_chi_tiet: 'Cần giới từ chỉ mốc thời gian hạn chót "trước thứ Sáu" -> "before Friday".',
    nguon_giai_thich: 'ETS TOEIC Practice Vol 1',
    tai_sao_a_sai: 'Đáp án chính xác.',
    tai_sao_b_sai: 'between cần đi với cấu trúc "between A and B".',
    tai_sao_c_sai: 'during đi với khoảng thời gian (khoảng sự kiện) chứ không đi với mốc ngày đơn lẻ.',
    tai_sao_d_sai: 'under nghĩa là dưới, không dùng chỉ mốc thời gian hạn chót.',
    chu_diem_ngu_phap: 'Prepositions',
    tu_loai: 'Preposition',
    danh_muc: 'Grammar',
    ky_nang: 'Time Prepositions',
    do_kho: 'easy',
    diem_so: 1.0,
    the_tags: 'preposition, toeic, discount',
    tu_vung_lien_quan: 'register, participant, discount',
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
  { Cột: 'cau_so', Ý_Nghĩa: 'Số thứ tự câu hỏi (Bắt buộc, số nguyên dương: 1, 2, 3...)', Ví_Dụ: '1' },
  { Cột: 'noi_dung_cau_hoi', Ý_Nghĩa: 'Nội dung đề bài câu hỏi (Bắt buộc)', Ví_Dụ: 'The manager _____ the report yesterday.' },
  { Cột: 'loai_cau_hoi', Ý_Nghĩa: 'multiple_choice | multiple_select | true_false | fill_in_blank | short_answer', Ví_Dụ: 'multiple_choice' },
  { Cột: 'lua_chon_a', Ý_Nghĩa: 'Lựa chọn phương án A (Bắt buộc với trắc nghiệm)', Ví_Dụ: 'complete' },
  { Cột: 'lua_chon_b', Ý_Nghĩa: 'Lựa chọn phương án B (Bắt buộc với trắc nghiệm)', Ví_Dụ: 'completed' },
  { Cột: 'lua_chon_c', Ý_Nghĩa: 'Lựa chọn phương án C (Tùy chọn)', Ví_Dụ: 'completing' },
  { Cột: 'lua_chon_d', Ý_Nghĩa: 'Lựa chọn phương án D (Tùy chọn)', Ví_Dụ: 'completion' },
  { Cột: 'dap_an_dung', Ý_Nghĩa: 'Ký tự đáp án đúng (A, B, C, D hoặc nội dung với điền từ)', Ví_Dụ: 'B' },
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

export const parseAndValidateExamExcel = async (file: File): Promise<ExcelExamParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Find sheet with exam data
        const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('de_thi') || s.toLowerCase().includes('exam')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawData || rawData.length === 0) {
          resolve({
            validQuestions: [],
            invalidQuestions: [{ rowNumber: 1, errors: ['File Excel trống hoặc không có dòng dữ liệu hợp lệ.'], rawRow: {} }],
            totalRows: 0,
            validCount: 0,
            invalidCount: 1,
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
        reject(new Error(`Lỗi xử lý file Excel: ${err?.message || 'Định dạng file không hợp lệ'}`));
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
