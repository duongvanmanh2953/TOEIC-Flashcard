import { CefrLevel } from '@prisma/client';

export interface SeedRule {
  title: string;
  explanationMd: string;
  structuresJson: string[];
  commonMistakes: string[];
  examples: Array<{
    sentence: string;
    translation: string;
    breakdownMd: string;
  }>;
}

export interface SeedExercise {
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  difficulty: number;
}

export interface SeedTopic {
  title: string;
  titleVi: string;
  summary: string;
  cefrLevel: CefrLevel;
  orderIndex: number;
  rules: SeedRule[];
  exercises: SeedExercise[];
}

export interface SeedCategory {
  code: string;
  title: string;
  titleVi: string;
  description: string;
  languageId: string;
  orderIndex: number;
  topics: SeedTopic[];
}

export const ENGLISH_GRAMMAR_CURRICULUM: SeedCategory[] = [
  // 1. A1 Foundations
  {
    code: 'A1_FOUNDATIONS',
    title: 'A1: Beginner English Foundations',
    titleVi: 'A1: Ngữ Pháp Nền Tảng Cho Người Mới Bắt Đầu',
    description: 'Bao quát 30 chủ điểm căn bản: Đại từ, Động từ To Be, Hiện tại đơn & tiếp diễn, Mạo từ, Danh từ đếm được/không đếm được, Giới từ chỉ nơi chốn & thời gian.',
    languageId: 'en',
    orderIndex: 1,
    topics: [
      {
        title: 'Subject & Object Pronouns',
        titleVi: 'Đại Từ Nhân Xưng & Đại Từ Tân Ngữ',
        summary: 'Nắm vững vai trò làm chủ ngữ (I, you, he, she, it, we, they) và tân ngữ (me, you, him, her, it, us, them).',
        cefrLevel: CefrLevel.A1,
        orderIndex: 1,
        rules: [
          {
            title: 'Quy tắc sử dụng Đại từ',
            explanationMd: 'Đại từ nhân xưng đứng trước động từ chính làm chủ ngữ. Đại từ tân ngữ đứng sau động từ hoặc sau giới từ.',
            structuresJson: [
              'Chủ ngữ: S (I/You/He/She/It/We/They) + V',
              'Tân ngữ: S + V + O (me/you/him/her/it/us/them)',
              'Sau giới từ: Preposition + O (to him, with us, for them)',
            ],
            commonMistakes: [
              'Nhầm lẫn giữa "He told I" (Sai) -> "He told me" (Đúng).',
              'Dùng sai đại từ sau giới từ "between you and I" -> "between you and me".',
            ],
            examples: [
              {
                sentence: 'She invited them to the annual conference.',
                translation: 'Cô ấy đã mời họ đến tham dự hội nghị thường niên.',
                breakdownMd: '**She** (S) + **invited** (V) + **them** (O) + **to the conference** (Prep phrase)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'My manager called ______ yesterday regarding the project update.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['me', 'I', 'he', 'we'],
            correctAnswer: 'me',
            acceptedAnswers: ['me'],
            explanation: 'Đứng sau động từ "called" cần một đại từ tân ngữ (me).',
            difficulty: 1.0,
          },
        ],
      },
      {
        title: 'Present Simple vs Present Continuous',
        titleVi: 'Hiện Tại Đơn & Hiện Tại Tiếp Diễn',
        summary: 'Phân biệt hành động thói quen/chân lý cố định và hành động đang diễn ra tại thời điểm nói hoặc xu hướng tạm thời.',
        cefrLevel: CefrLevel.A1,
        orderIndex: 2,
        rules: [
          {
            title: 'Sự khác biệt giữa hai thì hiện tại',
            explanationMd: 'Hiện tại đơn dùng với các trạng từ tần suất (always, usually, every day). Hiện tại tiếp diễn dùng với now, at the moment, currently và các động từ không chỉ trạng thái.',
            structuresJson: [
              'Hiện tại đơn: S + V(s/es)',
              'Hiện tại tiếp diễn: S + am/is/are + V-ing',
            ],
            commonMistakes: [
              'Dùng V-ing cho động từ trạng thái cảm xúc/nhận thức (stative verbs): I am knowing you (Sai) -> I know you (Đúng).',
            ],
            examples: [
              {
                sentence: 'He usually works from home, but this week he is working at headquarters.',
                translation: 'Anh ấy thường làm việc tại nhà, nhưng tuần này anh ấy đang làm tại trụ sở chính.',
                breakdownMd: '**usually works** (Thói quen - Simple) vs **is working** (Tạm thời - Continuous)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'Listen! The keynote speaker ______ the opening address right now.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['is delivering', 'delivers', 'delivered', 'has delivered'],
            correctAnswer: 'is delivering',
            acceptedAnswers: ['is delivering'],
            explanation: 'Dấu hiệu "Listen!" và "right now" diễn tả hành động đang xảy ra -> is delivering.',
            difficulty: 1.2,
          },
        ],
      },
    ],
  },

  // 2. A2 Elementary
  {
    code: 'A2_ELEMENTARY',
    title: 'A2: Elementary English Curriculum',
    titleVi: 'A2: Ngữ Pháp Sơ Cấp & Mở Rộng',
    description: '30 chủ điểm: Quá khứ đơn & tiếp diễn, Tương lai với Will/Be going to, Giới thiệu Hiện tại hoàn thành, Mệnh đề điều kiện loại 0 & 1, Động từ khuyết thiếu Should/Must/Have to.',
    languageId: 'en',
    orderIndex: 2,
    topics: [
      {
        title: 'Past Simple vs Past Continuous',
        titleVi: 'Quá Khứ Đơn & Quá Khứ Tiếp Diễn',
        summary: 'Sự kết hợp giữa hành động đang diễn ra (quá khứ tiếp diễn) thì hành động khác cắt ngang (quá khứ đơn).',
        cefrLevel: CefrLevel.A2,
        orderIndex: 1,
        rules: [
          {
            title: 'Cấu trúc When & While trong quá khứ',
            explanationMd: 'While + S + was/were + V-ing (hành động nền đang kéo dài), When + S + V2/ed (hành động ngắn cắt ngang).',
            structuresJson: [
              'While + S + was/were + V-ing, S + V2/ed',
              'S + was/were + V-ing + when + S + V2/ed',
            ],
            commonMistakes: [
              'Chia cả hai vế ở quá khứ tiếp diễn khi một hành động đã cắt ngang hoàn toàn.',
            ],
            examples: [
              {
                sentence: 'While we were discussing the budget, the electricity went out.',
                translation: 'Trong khi chúng tôi đang thảo luận về ngân sách thì điện bị mất.',
                breakdownMd: '**were discussing** (Đang kéo dài) + **went out** (Cắt ngang)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'The fire alarm rang while the engineering team ______ the software code.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['was testing', 'tests', 'has tested', 'will test'],
            correctAnswer: 'was testing',
            acceptedAnswers: ['was testing'],
            explanation: 'Hành động đang diễn ra trong quá khứ sau "while" -> was testing.',
            difficulty: 1.8,
          },
        ],
      },
      {
        title: 'Modal Verbs: Must, Have to, Should',
        titleVi: 'Động Từ Khuyết Thiếu: Must, Have to, Should',
        summary: 'Diễn tả sự bắt buộc nội tại (must), quy định khách quan bên ngoài (have to) và lời khuyên hữu ích (should).',
        cefrLevel: CefrLevel.A2,
        orderIndex: 2,
        rules: [
          {
            title: 'Phân biệt Must, Have to và Mustn\'t',
            explanationMd: 'Must diễn tả bắt buộc chủ quan. Have to là quy định pháp lý hoặc nội quy công ty. Mustn\'t là lệnh cấm tuyệt đối; don\'t have to là không bắt buộc (tùy ý).',
            structuresJson: [
              'S + must + V-bare (Bắt buộc)',
              'S + have/has to + V-bare (Nội quy khách quan)',
              'S + mustn\'t + V-bare (Cấm)',
              'S + don\'t/doesn\'t have to + V-bare (Không cần thiết)',
            ],
            commonMistakes: [
              'Nhầm lẫn giữa "mustn\'t" (cấm) và "don\'t have to" (không bắt buộc làm).',
            ],
            examples: [
              {
                sentence: 'Employees must wear safety helmets inside the manufacturing plant.',
                translation: 'Nhân viên bắt buộc phải đội mũ bảo hộ bên trong nhà máy sản xuất.',
                breakdownMd: '**must wear** (Quy chuẩn an toàn bắt buộc)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'Tomorrow is a national holiday, so staff ______ come to the office.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['do not have to', 'must not', 'should', 'have to'],
            correctAnswer: 'do not have to',
            acceptedAnswers: ['do not have to'],
            explanation: 'Ngày nghỉ lễ nên nhân viên không bắt buộc phải đến (do not have to).',
            difficulty: 2.0,
          },
        ],
      },
    ],
  },

  // 3. B1 Intermediate
  {
    code: 'B1_INTERMEDIATE',
    title: 'B1: Intermediate English Mastery',
    titleVi: 'B1: Ngữ Pháp Trung Cấp Chuyên Sâu',
    description: '36 chủ điểm trọng tâm: Hiện tại hoàn thành tiếp diễn, Quá khứ hoàn thành, Câu điều kiện loại 2 & 3, Câu bị động toàn diện, Câu gián tiếp, Mệnh đề quan hệ xác định & không xác định.',
    languageId: 'en',
    orderIndex: 3,
    topics: [
      {
        title: 'Reported Speech & Reporting Verbs',
        titleVi: 'Câu Tường Thuật & Động Từ Trần Thuật',
        summary: 'Kỹ thuật lùi thì, chuyển đổi đại từ và trạng từ chỉ thời gian/nơi chốn khi tường thuật phát biểu trong công việc.',
        cefrLevel: CefrLevel.B1,
        orderIndex: 1,
        rules: [
          {
            title: 'Quy tắc lùi thì và chuyển đổi đại từ',
            explanationMd: 'Khi động từ tường thuật ở quá khứ (said, told, reported), động từ trong mệnh đề phải lùi một thì (Present -> Past, Past -> Past Perfect, Will -> Would).',
            structuresJson: [
              'S + said (that) + S + V(lùi thì)',
              'S + told + O (that) + S + V(lùi thì)',
              'S + asked + O + if/whether + S + V(lùi thì)',
            ],
            commonMistakes: [
              'Quên lùi thì khi động từ tường thuật là "said" hoặc "told".',
              'Dùng "said me" thay vì "told me" hoặc "said to me".',
            ],
            examples: [
              {
                sentence: 'The director said that the firm had signed the partnership agreement.',
                translation: 'Giám đốc thông báo rằng công ty đã ký kết thỏa thuận hợp tác.',
                breakdownMd: '**said that** + **had signed** (Lùi thì từ Present Perfect/Past Simple)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'She told me that she ______ the quarterly financial statements the previous night.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['had completed', 'has completed', 'will complete', 'completes'],
            correctAnswer: 'had completed',
            acceptedAnswers: ['had completed'],
            explanation: 'Dấu hiệu "told me" và "the previous night" yêu cầu thì Quá khứ hoàn thành (had completed).',
            difficulty: 2.5,
          },
        ],
      },
    ],
  },

  // 4. B2 Upper Intermediate
  {
    code: 'B2_UPPER_INTERMEDIATE',
    title: 'B2: Upper Intermediate Academic Structures',
    titleVi: 'B2: Ngữ Pháp Trung Cao & Học Thuật',
    description: '32 chủ điểm: Điều kiện hỗn hợp (Mixed Conditionals), Đảo ngữ với trạng từ phủ định, Câu chẻ (Cleft sentences), Mệnh đề phân từ (Participle Clauses), Giả định cách (Subjunctive).',
    languageId: 'en',
    orderIndex: 4,
    topics: [
      {
        title: 'Negative Inversion',
        titleVi: 'Đảo Ngữ Sau Trạng Từ Phủ Định',
        summary: 'Tạo điểm nhấn trang trọng trong văn viết học thuật và báo cáo với Rarely, Seldom, Not only, Under no circumstances.',
        cefrLevel: CefrLevel.B2,
        orderIndex: 1,
        rules: [
          {
            title: 'Công thức đảo ngữ với trợ động từ',
            explanationMd: 'Khi trạng từ phủ định hoặc bán phủ định đứng đầu câu, ta đảo trợ động từ (Auxiliary verb) lên trước chủ ngữ.',
            structuresJson: [
              'Negative Adverbial (Seldom / Rarely / Never) + Aux + S + V-bare',
              'Not only + Aux + S + V, but also...',
              'Under no circumstances + should/can + S + V-bare',
            ],
            commonMistakes: [
              'Quên mượn trợ động từ do/does/did đối với động từ thường ở hiện tại và quá khứ.',
            ],
            examples: [
              {
                sentence: 'Seldom have we witnessed such exponential revenue growth in a single quarter.',
                translation: 'Hiếm khi chúng ta được chứng kiến sự tăng trưởng doanh thu vượt bậc như vậy trong một quý đơn lẻ.',
                breakdownMd: '**Seldom** (Negative) + **have** (Aux) + **we** (S) + **witnessed** (V3)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'Under no circumstances ______ employees disclose confidential client information.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['should', 'they should', 'they', 'shall they'],
            correctAnswer: 'should',
            acceptedAnswers: ['should'],
            explanation: 'Đảo ngữ với "Under no circumstances": trợ động từ "should" đứng trước chủ ngữ "employees".',
            difficulty: 3.2,
          },
        ],
      },
    ],
  },

  // 5. C1 Advanced
  {
    code: 'C1_ADVANCED',
    title: 'C1: Advanced Professional & Rhetorical Grammar',
    titleVi: 'C1: Ngữ Pháp Nâng Cao & Văn Phong Chuyên Gia',
    description: '24 chủ điểm: Fronting & Information packaging, Unreal past, Complex embedded clauses, Advanced modality, Stylistic ellipsis, Academic writing syntax.',
    languageId: 'en',
    orderIndex: 5,
    topics: [
      {
        title: 'Fronting & Information Packaging',
        titleVi: 'Đảo Ngữ Tiền Vị (Fronting) & Bố Cục Thông Tin',
        summary: 'Kỹ thuật đưa tân ngữ, trạng ngữ hoặc tính từ lên đầu câu để tạo sự liền mạch ý tưởng và nhấn mạnh chủ đề diễn ngôn.',
        cefrLevel: CefrLevel.C1,
        orderIndex: 1,
        rules: [
          {
            title: 'Quy tắc Fronting trong văn bản chuyên nghiệp',
            explanationMd: 'Fronting di chuyển thành phần không phải chủ ngữ lên đầu câu nhằm kết nối với mệnh đề trước hoặc tạo cao trào hùng biện.',
            structuresJson: [
              'Prepositional phrase + Verb + Subject (In front of the podium stood the CEO)',
              'Adjective phrase + Verb + Subject (More important is the long-term sustainability)',
            ],
            commonMistakes: [
              'Lạm dụng fronting trong giao tiếp thân mật khiến câu văn trở nên quá khiên cưỡng.',
            ],
            examples: [
              {
                sentence: 'Attached to this memorandum are the revised guidelines for data governance.',
                translation: 'Đính kèm bản ghi nhớ này là các hướng dẫn sửa đổi về quản trị dữ liệu.',
                breakdownMd: '**Attached to this memorandum** (Fronted PP) + **are** (V) + **the revised guidelines** (S)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'Enclosed with this correspondence ______ the audited balance sheets for the fiscal year.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['are', 'is', 'be', 'was'],
            correctAnswer: 'are',
            acceptedAnswers: ['are'],
            explanation: 'Chủ ngữ thực sự nằm sau động từ: "the audited balance sheets" (số nhiều) -> chia "are".',
            difficulty: 4.0,
          },
        ],
      },
    ],
  },

  // 6. C2 Mastery
  {
    code: 'C2_MASTERY',
    title: 'C2: Native Mastery & Literary Precision',
    titleVi: 'C2: Bậc Thầy Ngôn Ngữ & Độ Chuẩn Xác Bản Ngữ',
    description: '16 chủ điểm đỉnh cao: Nuanced aspectual distinctions, Pragmatic grammar, Subtle register shifts, Academic editing, Native-like stylistic synthesis.',
    languageId: 'en',
    orderIndex: 6,
    topics: [
      {
        title: 'Subtle Modality & Hedging in Academic Discourse',
        titleVi: 'Sắc Thái Tính Thái & Nghệ Thuật Giảm Tránh (Hedging)',
        summary: 'Sử dụng các cấu trúc tính thái tinh tế để trình bày lập luận thận trọng, chính xác và mang tầm vóc học thuật quốc tế.',
        cefrLevel: CefrLevel.C2,
        orderIndex: 1,
        rules: [
          {
            title: 'Chiến lược Hedging trong nghiên cứu và lập luận',
            explanationMd: 'Hedging sử dụng epistemic modals, reporting verbs có sắc thái thận trọng (suggest, indicate, tend to) để tránh khẳng định tuyệt đối hóa khi chưa có bằng chứng phổ quát.',
            structuresJson: [
              'The empirical data would seem to suggest that...',
              'It is arguably the case that...',
              'There is tentative evidence pointing towards...',
            ],
            commonMistakes: [
              'Khẳng định chắc nịch (overclaiming) bằng "proves that" thay vì các biểu thức chừng mực.',
            ],
            examples: [
              {
                sentence: 'The findings would appear to substantiate the hypothesis, albeit with considerable caveats.',
                translation: 'Các phát hiện dường như củng cố giả thuyết, dẫu còn nhiều điều kiện cần lưu ý đáng kể.',
                breakdownMd: '**would appear to substantiate** (Nuanced epistemic hedge) + **albeit with caveats** (Concessive clause)',
              },
            ],
          },
        ],
        exercises: [
          {
            questionText: 'The preliminary survey results ______ to indicate a systemic shift in consumer sentiment.',
            questionType: 'MULTIPLE_CHOICE',
            options: ['would appear', 'must certainly', 'will irrevocably', 'cannot fail'],
            correctAnswer: 'would appear',
            acceptedAnswers: ['would appear'],
            explanation: 'Trong văn phong học thuật C2, "would appear to indicate" thể hiện mức độ thận trọng khoa học chuẩn mực.',
            difficulty: 4.8,
          },
        ],
      },
    ],
  },
];
