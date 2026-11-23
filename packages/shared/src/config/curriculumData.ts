export interface LessonActivity {
  type: 'LEARN' | 'PRACTICE' | 'APPLY' | 'CHALLENGE' | 'REVIEW';
  title: string;
  instructions: string;
  content: any;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  type: 'VOCABULARY' | 'GRAMMAR' | 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING' | 'CHECKPOINT';
  durationMinutes: number;
  skills: string[];
  prerequisites: string[];
  objective: string;
  activities: LessonActivity[];
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description: string;
  biome: 'FOREST' | 'OCEAN' | 'HIGHLAND' | 'CELESTIAL';
  themeColor: string;
  checkpointId: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumStage {
  id: string;
  level: string; // A1, A2, B1, B2, C1 or HSK1-HSK4
  title: string;
  description: string;
  order: number;
  chapters: CurriculumChapter[];
}

export const MULTILINGUAL_CURRICULA: Record<string, CurriculumStage[]> = {
  en: [
    {
      id: 'en-stage-a2',
      level: 'A2',
      title: 'A2 Foundation: Giao Tiếp & Từ Vựng Cốt Lõi',
      description: 'Xây dựng phản xạ từ vựng cơ bản, cấu trúc câu sinh hoạt và nghe hiểu đời thực.',
      order: 1,
      chapters: [
        {
          id: 'en-ch-1',
          title: 'Essential Workplace & Daily Vocabulary',
          description: 'Nắm vững 50 từ vựng cốt lõi về công sở, lịch trình và giao dịch cơ bản.',
          biome: 'FOREST',
          themeColor: '#10b981',
          checkpointId: 'en-cp-1',
          lessons: [
            {
              id: 'en-les-1',
              title: 'Daily Routine & Workplace Habits',
              type: 'VOCABULARY',
              durationMinutes: 12,
              skills: ['Vocabulary', 'Reading'],
              prerequisites: [],
              objective: 'Nắm vững và vận dụng 10 từ vựng miêu tả thói quen làm việc và lịch trình.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Khám Phá Từ Vựng Mới',
                  instructions: 'Đọc kỹ từ vựng, phiên âm IPA, nghĩa và ngữ cảnh minh họa.',
                  content: {
                    items: [
                      { word: 'schedule', ipa: '/ˈskedʒ.uːl/', meaning: 'Lịch trình, thời gian biểu', example: 'We need to review our weekly schedule before the meeting.' },
                      { word: 'deadline', ipa: '/ˈded.laɪn/', meaning: 'Hạn chót hoàn thành', example: 'The project deadline is this Friday at 5 PM.' },
                      { word: 'priority', ipa: '/praɪˈɒr.ə.ti/', meaning: 'Sự ưu tiên hàng đầu', example: 'Customer satisfaction is our highest priority.' },
                      { word: 'coordinate', ipa: '/koʊˈɔːr.də.neɪt/', meaning: 'Phối hợp công việc', example: 'She coordinates all internal communications.' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện & Phản Xạ',
                  instructions: 'Chọn đáp án chính xác nhất để hoàn thiện câu.',
                  content: {
                    questions: [
                      { q: 'Please make sure you submit the report before the ____ at 5 PM.', options: ['schedule', 'deadline', 'priority', 'routine'], answer: 'deadline' },
                      { q: 'He needs to ____ closely with the design team.', options: ['coordinate', 'postpone', 'dismiss', 'hesitate'], answer: 'coordinate' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Áp Dụng Vào Ngữ Cảnh Thực Chiến',
                  instructions: 'Sắp xếp cụm từ để tạo thành câu hoàn chỉnh và chính xác.',
                  content: {
                    target: 'We should set our priority for this quarter.',
                    words: ['this quarter.', 'for', 'set our priority', 'We should'],
                  },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Tốc Độ 60 Giây',
                  instructions: 'Xác định từ đồng nghĩa với "urgent task".',
                  content: {
                    question: 'Từ nào đồng nghĩa với "urgent task that needs immediate attention"?',
                    options: ['High priority', 'Deferred schedule', 'Optional routine', 'Casual note'],
                    answer: 'High priority',
                  },
                },
                {
                  type: 'REVIEW',
                  title: 'Củng Cố Trí Nhớ FSRS',
                  instructions: 'Xác nhận lại mức độ tự tin ghi nhớ từ vừa học.',
                  content: { words: ['schedule', 'deadline', 'priority', 'coordinate'] },
                },
              ],
            },
            {
              id: 'en-les-2',
              title: 'Essential Grammar in Context',
              type: 'GRAMMAR',
              durationMinutes: 15,
              skills: ['Grammar', 'Writing'],
              prerequisites: ['en-les-1'],
              objective: 'Phân biệt và sử dụng chính xác thì Hiện tại đơn vs Hiện tại tiếp diễn trong công việc.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Quy Tắc Ngữ Pháp Ứng Dụng',
                  instructions: 'Hiểu bản chất diễn đạt sự thật hiển nhiên vs sự việc đang diễn ra tạm thời.',
                  content: {
                    rules: [
                      'Hiện tại đơn: Diễn tả lịch trình cố định, thói quen lặp lại.',
                      'Hiện tại tiếp diễn: Diễn tả dự án đang thực hiện hoặc xu hướng tạm thời.',
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Trắc Nghiệm Phân Biệt Thì',
                  instructions: 'Chọn động từ chia đúng cho ngữ cảnh sau:',
                  content: {
                    questions: [
                      { q: 'Currently, the marketing team ____ a new campaign.', options: ['runs', 'is running', 'ran', 'has run'], answer: 'is running' },
                      { q: 'Our flight ____ at 8:30 tomorrow morning.', options: ['departs', 'is departing', 'departed', 'will be departed'], answer: 'departs' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Viết Lại Câu Chuẩn Mực',
                  instructions: 'Viết lại câu sử dụng từ gợi ý mà không đổi nghĩa.',
                  content: {
                    prompt: 'Complete the sentence: "At the moment, I (prepare) the quarterly slides."',
                    solution: 'At the moment, I am preparing the quarterly slides.',
                  },
                },
              ],
            },
            {
              id: 'en-cp-1',
              title: 'Chapter 1 Mastery Checkpoint',
              type: 'CHECKPOINT',
              durationMinutes: 18,
              skills: ['Vocabulary', 'Grammar', 'Listening', 'Reading'],
              prerequisites: ['en-les-1', 'en-les-2'],
              objective: 'Kiểm tra toàn diện năng lực Chapter 1 để đánh giá ngưỡng Mastery (yêu cầu tối thiểu 80%).',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Comprehensive Mastery Assessment',
                  instructions: 'Hoàn thành 5 câu hỏi sát hạch năng lực cốt lõi.',
                  content: {
                    questions: [
                      { q: 'The company set a strict ____ for financial auditing.', options: ['priority', 'deadline', 'routine', 'interval'], answer: 'deadline' },
                      { q: 'Right now, our CEO ____ with European investors.', options: ['is negotiating', 'negotiates', 'negotiated', 'was negotiated'], answer: 'is negotiating' },
                      { q: 'Which word describes organizing activities among multiple departments?', options: ['coordinate', 'hesitate', 'complicate', 'isolate'], answer: 'coordinate' },
                      { q: 'The project manager is responsible for keeping the team on ____.', options: ['track', 'run', 'walk', 'jump'], answer: 'track' },
                      { q: 'Identify the synonym for "crucial matter":', options: ['High priority', 'Casual affair', 'Minor issue', 'Trivial note'], answer: 'High priority' },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'en-ch-2',
          title: 'Listening & Professional Dialogue',
          description: 'Nâng cao phản xạ nghe hội thoại, hiểu nhanh thông điệp chính và từ khóa cốt lõi.',
          biome: 'OCEAN',
          themeColor: '#0ea5e9',
          checkpointId: 'en-cp-2',
          lessons: [
            {
              id: 'en-les-3',
              title: 'Phone Calls & Appointment Confirmations',
              type: 'LISTENING',
              durationMinutes: 15,
              skills: ['Listening', 'Speaking'],
              prerequisites: ['en-cp-1'],
              objective: 'Nghe hiểu và bắt thông tin lịch hẹn, thời gian và số liệu qua điện thoại.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Nghe Hội Thoại Mẫu',
                  instructions: 'Nghe đoạn ghi âm cuộc hẹn kinh doanh và ghi chú các mốc thời gian.',
                  content: {
                    transcript: "Good morning, this is Alex from Finora Corp. I'd like to confirm our briefing scheduled for Thursday at 2:30 PM in Conference Room B.",
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Trắc Nghiệm Bắt Thông Tin',
                  instructions: 'Chọn thời gian chính xác được đề cập trong cuộc gọi:',
                  content: {
                    questions: [
                      { q: 'What time is the meeting scheduled for?', options: ['Thursday at 2:30 PM', 'Friday at 3:00 PM', 'Wednesday at 2:30 PM', 'Thursday at 10:00 AM'], answer: 'Thursday at 2:30 PM' },
                      { q: 'Where will the briefing take place?', options: ['Conference Room B', 'Main Hall', 'Online Zoom', 'Office 402'], answer: 'Conference Room B' },
                    ],
                  },
                },
              ],
            },
            {
              id: 'en-cp-2',
              title: 'Chapter 2 Mastery Checkpoint',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Listening', 'Vocabulary'],
              prerequisites: ['en-les-3'],
              objective: 'Đánh giá kỹ năng phản xạ âm thanh và phân tích hội thoại.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Audio Comprehension Check',
                  instructions: 'Trả lời nhanh 3 câu hỏi nghe hiểu thực tế.',
                  content: {
                    questions: [
                      { q: 'If the caller says "I will follow up shortly", what does it mean?', options: ['They will contact you soon', 'They will cancel the contract', 'They want you to leave', 'They are declining the offer'], answer: 'They will contact you soon' },
                      { q: 'Select the proper response to "Could we reschedule our call?":', options: ['Sure, what time works best for you?', 'No, I have not eaten yet.', 'Yes, I am a manager.', 'Thank you for yesterday.'], answer: 'Sure, what time works best for you?' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'en-stage-b1',
      level: 'B1',
      title: 'B1 Intermediate: Tự Tin Thảo Luận & Làm Việc',
      description: 'Mở rộng khả năng trình bày quan điểm, viết email công việc và phản biện logic.',
      order: 2,
      chapters: [
        {
          id: 'en-ch-3',
          title: 'Professional Email & Formal Expressions',
          description: 'Soạn thảo email trang trọng, đề xuất giải pháp và đàm phán hợp đồng.',
          biome: 'HIGHLAND',
          themeColor: '#8b5cf6',
          checkpointId: 'en-cp-3',
          lessons: [
            {
              id: 'en-les-4',
              title: 'Writing Polished Business Emails',
              type: 'WRITING',
              durationMinutes: 20,
              skills: ['Writing', 'Vocabulary'],
              prerequisites: ['en-cp-2'],
              objective: 'Thành thạo mở đầu, nội dung đề xuất và lời kết trong email chuyên nghiệp.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Khung Email Chuẩn Mực',
                  instructions: 'Nắm cấu trúc: Greeting -> Purpose -> Action Items -> Call to Action -> Sign-off.',
                  content: {
                    templates: [
                      'Dear [Name], I am writing to update you on...',
                      'Could you please confirm if the attached figures align with your expectations?',
                    ],
                  },
                },
              ],
            },
            {
              id: 'en-cp-3',
              title: 'B1 Intermediate Comprehensive Milestone',
              type: 'CHECKPOINT',
              durationMinutes: 25,
              skills: ['Reading', 'Writing', 'Grammar'],
              prerequisites: ['en-les-4'],
              objective: 'Đánh giá năng lực tổng thể B1 trước khi chuyển sang Stage B2.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'B1 Milestone Exam',
                  instructions: 'Hoàn thành các câu hỏi đánh giá ngữ pháp nâng cao.',
                  content: {
                    questions: [
                      { q: 'Which sentence has the most polite and professional tone?', options: ['I would appreciate it if you could review the draft.', 'Look at the file now.', 'You must read this today.', 'Why did you not reply?'], answer: 'I would appreciate it if you could review the draft.' },
                      { q: 'Fill in the blank: "Despite the budget constraints, the team ____ the project on time."', options: ['delivered', 'delivering', 'has delivered', 'is delivered'], answer: 'delivered' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  zh: [
    {
      id: 'zh-stage-hsk2',
      level: 'HSK 2',
      title: 'HSK 2: Giao Tiếp Hàng Ngày & Phản Xạ Hán Tự',
      description: 'Làm quen 300 từ vựng HSK cốt lõi, phiên âm Pinyin và mẫu câu sinh hoạt.',
      order: 1,
      chapters: [
        {
          id: 'zh-ch-1',
          title: 'Sinh Hoạt & Mua Sắm Cơ Bản',
          description: 'Hỏi giá, chỉ đường, số lượng và giao tiếp cửa hàng.',
          biome: 'FOREST',
          themeColor: '#10b981',
          checkpointId: 'zh-cp-1',
          lessons: [
            {
              id: 'zh-les-1',
              title: 'Số Đếm, Tiền Tệ & Hỏi Giá',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Nắm vững cách hỏi giá "这个多少钱？" và phản xạ số đếm.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Từ Vựng Mua Sắm',
                  instructions: 'Học các từ: 多少 (bao nhiêu), 块 (đồng), 贵 (đắt), 便宜 (rẻ).',
                  content: {
                    items: [
                      { word: '多少', pinyin: 'duōshǎo', meaning: 'Bao nhiêu' },
                      { word: '便宜', pinyin: 'piányi', meaning: 'Rẻ, giá hời' },
                    ],
                  },
                },
              ],
            },
            {
              id: 'zh-cp-1',
              title: 'HSK 2 Chapter 1 Checkpoint',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Reading'],
              prerequisites: ['zh-les-1'],
              objective: 'Kiểm tra nắm vững từ vựng và chữ Hán HSK 2.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Sát Hạch Hán Tự',
                  instructions: 'Chọn đáp án đúng nhất:',
                  content: {
                    questions: [
                      { q: '"这个太贵了，能不能____一点？"', options: ['便宜', '高兴', '漂亮', '容易'], answer: '便宜' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  ja: [
    {
      id: 'ja-stage-n4',
      level: 'N4',
      title: 'JLPT N4: Ngữ Pháp Cơ Bản & Giao Tiếp Đời Sống',
      description: 'Học trợ từ, thể Te, thể Nai và từ vựng giao tiếp Nhật Bản thường nhật.',
      order: 1,
      chapters: [
        {
          id: 'ja-ch-1',
          title: 'Hội Thoại Công Sở & Đi Lại',
          description: 'Đi tàu điện, hỏi thăm đồng nghiệp và đặt lịch hẹn.',
          biome: 'FOREST',
          themeColor: '#10b981',
          checkpointId: 'ja-cp-1',
          lessons: [
            {
              id: 'ja-les-1',
              title: 'Trợ Từ & Động Từ Di Chuyển',
              type: 'GRAMMAR',
              durationMinutes: 15,
              skills: ['Grammar', 'Vocabulary'],
              prerequisites: [],
              objective: 'Sử dụng thuần thục trợ từ に、で、へ với các động từ 行きます、来ます。',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Phân Biệt Trợ Từ',
                  instructions: 'Hiểu bản chất phương tiện (で) vs đích đến (へ/に).',
                  content: { rules: ['電車で会社へ行きます: Đi đến công ty bằng tàu điện.'] },
                },
              ],
            },
            {
              id: 'ja-cp-1',
              title: 'JLPT N4 Checkpoint',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Grammar', 'Reading'],
              prerequisites: ['ja-les-1'],
              objective: 'Sát hạch cấu trúc câu và trợ từ tiếng Nhật.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Trắc Nghiệm Trợ Từ',
                  instructions: 'Chọn trợ từ thích hợp:',
                  content: {
                    questions: [
                      { q: '明日、バス____空港へ行きます。', options: ['で', 'に', 'を', 'が'], answer: 'で' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  ko: [
    {
      id: 'ko-stage-topik1',
      level: 'TOPIK I',
      title: 'TOPIK I (Cấp 2): Giao Tiếp & Kính Ngữ Căn Bản',
      description: 'Nắm vững đuôi câu -아/어요, kính ngữ -(으)시 và từ vựng đời sống Hàn Quốc.',
      order: 1,
      chapters: [
        {
          id: 'ko-ch-1',
          title: 'Đời Sống Hàng Ngày & Ăn Uống',
          description: 'Gọi món tại nhà hàng, giao tiếp bạn bè và mua sắm.',
          biome: 'FOREST',
          themeColor: '#10b981',
          checkpointId: 'ko-cp-1',
          lessons: [
            {
              id: 'ko-les-1',
              title: 'Gọi Món & Biểu Đạt Mong Muốn -고 싶다',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Nói thành thạo mong muốn bằng đuôi câu -고 싶어요.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Mẫu Câu Gọi Món',
                  instructions: 'Học: 비빔밥을 먹고 싶어요 (Tôi muốn ăn Bibimbap).',
                  content: { items: [{ word: '먹다', meaning: 'Ăn' }, { word: '마시다', meaning: 'Uống' }] },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện Từ Vựng',
                  instructions: 'Chọn từ mang nghĩa "Uống nước":',
                  content: { questions: [{ q: '"Nước uống" trong tiếng Hàn là:', options: ['물', '우유', '차', '커피'], answer: '물' }] },
                },
                {
                  type: 'APPLY',
                  title: 'Ghép Câu Hoàn Chỉnh',
                  instructions: 'Ghép câu: Tôi muốn uống nước mát.',
                  content: { target: '물을 마시고 싶어요.', words: ['싶어요.', '마시고', '물을'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Phản Xạ Nhanh',
                  instructions: 'Chọn đuôi câu phù hợp với "가다" khi muốn nói "tôi muốn đi":',
                  content: { questions: [{ q: '가다 + -고 싶다 -> ?', options: ['가고 싶어요', '가요', '갔어요', '가지 마세요'], answer: '가고 싶어요' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Tổng Kết & Ôn Tập',
                  instructions: 'Ghi nhớ cấu trúc Động từ + -고 싶어요.',
                  content: { summary: 'Cấu trúc biểu đạt mong muốn cơ bản nhất trong TOPIK I.' },
                },
              ],
            },
            {
              id: 'ko-cp-1',
              title: 'TOPIK I Checkpoint',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Grammar'],
              prerequisites: ['ko-les-1'],
              objective: 'Đánh giá năng lực từ vựng và ngữ pháp tiếng Hàn cơ bản.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Trắc Nghiệm TOPIK',
                  instructions: 'Điền từ còn thiếu vào chỗ trống:',
                  content: {
                    questions: [
                      { q: '한국 음식을 ____ 싶어요.', options: ['먹고', '가고', '자고', '보고'], answer: '먹고' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ==========================================
  // GERMAN (DE)
  // ==========================================
  de: [
    {
      id: 'de-stage-a1',
      level: 'A1',
      title: 'A1 Start Deutsch: Nền Tảng & Giao Tiếp Đời Sống',
      description: 'Làm quen bảng chữ cái, phát âm, quán từ der/die/das và mẫu câu chào hỏi Đức.',
      order: 1,
      chapters: [
        {
          id: 'de-ch-1',
          title: 'Chào Hỏi & Sinh Hoạt Thường Ngày',
          description: 'Tự giới thiệu, hỏi thăm sức khỏe, gọi đồ uống và mua sắm cơ bản.',
          biome: 'FOREST',
          themeColor: '#f59e0b',
          checkpointId: 'de-cp-1',
          lessons: [
            {
              id: 'de-les-1',
              title: 'Begrüßung & Sich Vorstellen (Chào hỏi & Giới thiệu)',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Nắm vững câu chào hỏi Guten Tag, Wie geht es Ihnen? và cách xưng hô.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Khám Phá Câu Chào Đức',
                  instructions: 'Đọc kỹ các cách chào theo thời điểm trong ngày.',
                  content: {
                    items: [
                      { word: 'Guten Tag', meaning: 'Xin chào (ban ngày)' },
                      { word: 'Auf Wiedersehen', meaning: 'Tạm biệt (trang trọng)' },
                      { word: 'Danke schön', meaning: 'Cảm ơn rất nhiều' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện',
                  instructions: 'Chọn câu đáp lại lịch sự cho "Wie geht es dir?":',
                  content: {
                    questions: [
                      { q: 'Chọn câu trả lời đúng:', options: ['Gut, danke!', 'Guten Abend', 'Ich heiße Anna', 'Auf Wiedersehen'], answer: 'Gut, danke!' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Áp Dụng Thực Tế',
                  instructions: 'Sắp xếp câu giới thiệu bản thân:',
                  content: { target: 'Ich komme aus Vietnam.', words: ['aus Vietnam.', 'Ich', 'komme'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Tốc Độ',
                  instructions: 'Quán từ xác định giống đực (Maskulin) trong tiếng Đức là:',
                  content: { questions: [{ q: 'Quán từ giống đực:', options: ['der', 'die', 'das', 'den'], answer: 'der' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Ghi Nhớ Cốt Lõi',
                  instructions: 'Ôn tập 3 giống: der (đực), die (cái), das (trung).',
                  content: { rule: 'Mỗi danh từ tiếng Đức đều đi kèm giống cố định và viết hoa chữ cái đầu.' },
                },
              ],
            },
            {
              id: 'de-cp-1',
              title: 'A1 Checkpoint Sát Hạch',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Grammar'],
              prerequisites: ['de-les-1'],
              objective: 'Kiểm tra nắm vững giao tiếp và ngữ pháp A1 Đức.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Kiểm Tra Tổng Hợp A1',
                  instructions: 'Điền từ thích hợp:',
                  content: {
                    questions: [
                      { q: '____ Haus ist sehr modern.', options: ['Das', 'Der', 'Die', 'Einem'], answer: 'Das' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ==========================================
  // FRENCH (FR)
  // ==========================================
  fr: [
    {
      id: 'fr-stage-a1',
      level: 'A1',
      title: 'DELF A1: Khởi Đầu Tiếng Pháp & Phản Xạ Âm Điệu',
      description: 'Luyện phát âm chuẩn Pháp, nối âm (liaison), đại từ nhân xưng và giao tiếp lịch thiệp.',
      order: 1,
      chapters: [
        {
          id: 'fr-ch-1',
          title: 'Bonjour Paris & Đời Sống Hàng Ngày',
          description: 'Hỏi thăm, gọi món tại quán cà phê và chỉ đường.',
          biome: 'OCEAN',
          themeColor: '#3b82f6',
          checkpointId: 'fr-cp-1',
          lessons: [
            {
              id: 'fr-les-1',
              title: 'Les Salutations & La Politesse (Chào hỏi & Lịch sự)',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Listening'],
              prerequisites: [],
              objective: 'Phản xạ với Bonjour, Merci beaucoup, S\'il vous plaît trong đời sống.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Từ Vựng Lịch Thiệp Pháp',
                  instructions: 'Nắm chắc ngữ điệu các câu chào quen thuộc.',
                  content: {
                    items: [
                      { word: 'Bonjour', ipa: '/bɔ̃.ʒuʁ/', meaning: 'Xin chào' },
                      { word: 'Merci', ipa: '/mɛʁ.si/', meaning: 'Cảm ơn' },
                      { word: 'S\'il vous plaît', ipa: '/sil vu plɛ/', meaning: 'Làm ơn / Xin vui lòng' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện Ngữ Âm',
                  instructions: 'Chọn nghĩa đúng của "Merci beaucoup":',
                  content: {
                    questions: [
                      { q: '"Merci beaucoup" nghĩa là gì?', options: ['Cảm ơn rất nhiều', 'Xin chào buổi sáng', 'Chúc ngủ ngon', 'Hẹn gặp lại'], answer: 'Cảm ơn rất nhiều' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Vận Dụng Ngữ Cảnh',
                  instructions: 'Sắp xếp câu gọi đồ uống lịch thiệp:',
                  content: { target: 'Un café, s\'il vous plaît.', words: ['s\'il vous plaît.', 'Un café,'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Phản Xạ 60s',
                  instructions: 'Khi muốn nói "Tạm biệt" bằng tiếng Pháp, người ta nói:',
                  content: { questions: [{ q: 'Tạm biệt:', options: ['Au revoir', 'Bonjour', 'Pardon', 'Merci'], answer: 'Au revoir' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Ghi Nhớ Cốt Lõi',
                  instructions: 'Nắm vững quy tắc nói "S\'il vous plaît" khi yêu cầu bất kỳ dịch vụ nào.',
                  content: { tip: 'Người Pháp đặc biệt đề cao sự lịch thiệp khi bắt đầu bằng Bonjour và kết thúc bằng Merci.' },
                },
              ],
            },
            {
              id: 'fr-cp-1',
              title: 'DELF A1 Checkpoint Sát Hạch',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Listening', 'Speaking'],
              prerequisites: ['fr-les-1'],
              objective: 'Đánh giá năng lực phát âm và từ vựng cơ bản.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Kiểm Tra Checkpoint A1',
                  instructions: 'Chọn câu đúng nhất:',
                  content: {
                    questions: [
                      { q: 'Comment allez-vous ? -> Réponse :', options: ['Je vais bien, merci !', 'Au revoir', 'De rien', 'Bonne nuit'], answer: 'Je vais bien, merci !' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ==========================================
  // SPANISH (ES)
  // ==========================================
  es: [
    {
      id: 'es-stage-a1',
      level: 'A1',
      title: 'DELE A1: Tiếng Tây Ban Nha Thực Chiến & Du Lịch',
      description: 'Nắm vững phản xạ chào hỏi Hola, danh từ giống đực/cái (-o/-a) và hội thoại sinh hoạt.',
      order: 1,
      chapters: [
        {
          id: 'es-ch-1',
          title: 'Giao Tiếp Cơ Bản & Du Lịch Tây Ban Nha',
          description: 'Hỏi giá, tự giới thiệu và sinh hoạt hàng ngày tại Madrid.',
          biome: 'FOREST',
          themeColor: '#ea580c',
          checkpointId: 'es-cp-1',
          lessons: [
            {
              id: 'es-les-1',
              title: 'Saludos y Presentaciones (Chào hỏi & Giới thiệu)',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Tự tin nói ¡Hola! ¿Cómo estás? và giới thiệu tên tuổi.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Mẫu Câu Chào Tây Ban Nha',
                  instructions: 'Đọc kỹ cách chào và cảm ơn trong tiếng Tây Ban Nha.',
                  content: {
                    items: [
                      { word: 'Hola', meaning: 'Xin chào' },
                      { word: 'Gracias', meaning: 'Cảm ơn' },
                      { word: 'Por favor', meaning: 'Làm ơn / Vui lòng' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện Phản Xạ',
                  instructions: 'Chọn câu trả lời cho "¿Cómo estás?":',
                  content: {
                    questions: [
                      { q: '¿Cómo estás?', options: ['Muy bien, gracias', 'Me llamo Carlos', 'De nada', 'Hasta luego'], answer: 'Muy bien, gracias' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Ghép Câu Thực Tế',
                  instructions: 'Ghép câu giới thiệu: Tên tôi là Maria.',
                  content: { target: 'Me llamo Maria.', words: ['Maria.', 'Me llamo'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Tốc Độ',
                  instructions: 'Nghĩa của "De nada" là:',
                  content: { questions: [{ q: 'De nada = ?', options: ['Không có chi', 'Xin chào', 'Tạm biệt', 'Xin lỗi'], answer: 'Không có chi' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Củng Cố Kiến Thức',
                  instructions: 'Ghi nhớ đuôi danh từ: -o thường là giống đực, -a thường là giống cái.',
                  content: { summary: 'Quy tắc giống từ cơ bản của tiếng Tây Ban Nha.' },
                },
              ],
            },
            {
              id: 'es-cp-1',
              title: 'DELE A1 Checkpoint Sát Hạch',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Reading'],
              prerequisites: ['es-les-1'],
              objective: 'Kiểm tra độ thành thạo giao tiếp sơ cấp Tây Ban Nha.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Sát Hạch DELE A1',
                  instructions: 'Chọn đáp án chính xác:',
                  content: {
                    questions: [
                      { q: 'Muchas ____ por todo.', options: ['gracias', 'hola', 'adiós', 'por favor'], answer: 'gracias' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ==========================================
  // THAI (TH)
  // ==========================================
  th: [
    {
      id: 'th-stage-beginner',
      level: 'A1',
      title: 'Tiếng Thái Sơ Cấp: Du Lịch & Giao Tiếp Bangkok',
      description: 'Làm quen phụ âm, nguyên âm, từ đuôi lịch sự (khráp/khâ) và câu sinh hoạt.',
      order: 1,
      chapters: [
        {
          id: 'th-ch-1',
          title: 'Giao Tiếp & Ẩm Thực Đường Phố',
          description: 'Chào hỏi, gọi món Tom Yum, hỏi giá và đi xe Tuk Tuk.',
          biome: 'OCEAN',
          themeColor: '#06b6d4',
          checkpointId: 'th-cp-1',
          lessons: [
            {
              id: 'th-les-1',
              title: 'Sawasdee & Từ Đuôi Lịch Sự (Chào hỏi)',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Nắm vững cách chào Sawasdee khráp / khâ và biểu đạt cảm ơn Khop khun.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Khám Phá Từ Vựng Thái',
                  instructions: 'Nam dùng từ đuôi ครับ (khráp), nữ dùng ค่ะ (khâ).',
                  content: {
                    items: [
                      { word: 'สวัสดี', phonetic: 'sawasdee', meaning: 'Xin chào' },
                      { word: 'ขอบคุณ', phonetic: 'khop khun', meaning: 'Cảm ơn' },
                      { word: 'อร่อย', phonetic: 'aroi', meaning: 'Ngon miệng' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện Từ',
                  instructions: 'Chọn từ mang nghĩa "Ngon miệng":',
                  content: {
                    questions: [
                      { q: '"Ngon miệng" tiếng Thái là gì?', options: ['อร่อย (Aroi)', 'ขอบคุณ (Khop khun)', 'สวัสดี (Sawasdee)', 'เผ็ด (Phet)'], answer: 'อร่อย (Aroi)' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Áp Dụng Thực Chiến',
                  instructions: 'Ghép câu khen ngợi: Món ăn này rất ngon.',
                  content: { target: 'อาหารนี้อร่อยมากครับ', words: ['อร่อยมากครับ', 'อาหารนี้'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Tốc Độ',
                  instructions: 'Nữ giới tiếng Thái thêm từ đệm lịch sự nào cuối câu?',
                  content: { questions: [{ q: 'Từ lịch sự cho nữ:', options: ['ค่ะ (khâ)', 'ครับ (khráp)', 'นะ (na)', 'จ้ะ (ja)'], answer: 'ค่ะ (khâ)' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Ghi Nhớ Cốt Lõi',
                  instructions: 'Luôn thêm từ đệm lịch sự để thể hiện sự tôn trọng trong văn hóa Thái.',
                  content: { tip: 'Chào hỏi đi kèm cử chỉ chắp tay Wai trước ngực.' },
                },
              ],
            },
            {
              id: 'th-cp-1',
              title: 'Tiếng Thái Checkpoint Sát Hạch',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: ['th-les-1'],
              objective: 'Kiểm tra phản xạ giao tiếp tiếng Thái cơ bản.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Sát Hạch Giao Tiếp',
                  instructions: 'Chọn câu đáp lại khi được người Thái giúp đỡ:',
                  content: {
                    questions: [
                      { q: 'Cảm ơn bằng tiếng Thái:', options: ['ขอบคุณมากครับ', 'สวัสดีครับ', 'ไม่เป็นไร', 'ขอโทษครับ'], answer: 'ขอบคุณมากครับ' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ==========================================
  // VIETNAMESE (VI)
  // ==========================================
  vi: [
    {
      id: 'vi-stage-b1',
      level: 'B1',
      title: 'Tiếng Việt Ứng Dụng: Ngữ Cảnh Giao Tiếp & Văn Hóa Đời Thực',
      description: 'Làm giàu vốn từ chuyên sâu, đại từ xưng hô tôn ti trật tự và ngữ điệu biểu cảm.',
      order: 1,
      chapters: [
        {
          id: 'vi-ch-1',
          title: 'Giao Tiếp Xã Hội & Phong Cách Làm Việc',
          description: 'Xưng hô thân mật, thương thảo công việc và biểu đạt cảm xúc tinh tế.',
          biome: 'HIGHLAND',
          themeColor: '#10b981',
          checkpointId: 'vi-cp-1',
          lessons: [
            {
              id: 'vi-les-1',
              title: 'Hệ Thống Xưng Hô & Tinh Thần Đồng Đội',
              type: 'VOCABULARY',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Speaking'],
              prerequisites: [],
              objective: 'Nắm vững các từ vựng diễn tả phẩm chất: Kiên định, Hoài bão, Đồng lòng.',
              activities: [
                {
                  type: 'LEARN',
                  title: 'Từ Vựng Tinh Thần',
                  instructions: 'Đọc kỹ ý nghĩa và ngữ cảnh vận dụng các từ vựng sâu sắc.',
                  content: {
                    items: [
                      { word: 'Kiên định', meaning: 'Giữ vững ý chí, lập trường trước khó khăn' },
                      { word: 'Hoài bão', meaning: 'Ước mơ lớn lao, khát vọng tương lai' },
                      { word: 'Đồng lòng', meaning: 'Cùng một ý chí, hiệp lực thực hiện mục tiêu' },
                    ],
                  },
                },
                {
                  type: 'PRACTICE',
                  title: 'Luyện Nhận Diện Từ',
                  instructions: 'Chọn từ mang nghĩa "cùng chung ý chí, hiệp lực":',
                  content: {
                    questions: [
                      { q: 'Từ nào mang nghĩa hiệp lực cùng chí hướng?', options: ['Đồng lòng', 'Kiên định', 'Hoài bão', 'Cẩn trọng'], answer: 'Đồng lòng' },
                    ],
                  },
                },
                {
                  type: 'APPLY',
                  title: 'Vận Dụng Viết Câu',
                  instructions: 'Sắp xếp câu hoàn chỉnh:',
                  content: { target: 'Tập thể đồng lòng vượt qua thử thách.', words: ['vượt qua thử thách.', 'Tập thể', 'đồng lòng'] },
                },
                {
                  type: 'CHALLENGE',
                  title: 'Thử Thách Tốc Độ',
                  instructions: 'Từ đồng nghĩa với "khát vọng lớn lao" là:',
                  content: { questions: [{ q: 'Khát vọng lớn lao = ?', options: ['Hoài bão', 'Ảo tưởng', 'Lo sợ', 'Do dự'], answer: 'Hoài bão' }] },
                },
                {
                  type: 'REVIEW',
                  title: 'Tổng Kết',
                  instructions: 'Ôn tập 3 từ vựng phẩm chất lãnh đạo.',
                  content: { summary: 'Vận dụng từ ngữ giàu cảm xúc giúp tăng tính thuyết phục trong giao tiếp.' },
                },
              ],
            },
            {
              id: 'vi-cp-1',
              title: 'Tiếng Việt Checkpoint Sát Hạch',
              type: 'CHECKPOINT',
              durationMinutes: 15,
              skills: ['Vocabulary', 'Writing'],
              prerequisites: ['vi-les-1'],
              objective: 'Đánh giá năng lực sử dụng từ vựng tiếng Việt nâng cao.',
              activities: [
                {
                  type: 'CHALLENGE',
                  title: 'Sát Hạch Năng Lực',
                  instructions: 'Điền từ thích hợp:',
                  content: {
                    questions: [
                      { q: 'Người lãnh đạo cần ____ với mục tiêu dài hạn.', options: ['kiên định', 'dao động', 'bảo thủ', 'do dự'], answer: 'kiên định' },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ==========================================
// AI ROADMAP RECOMMENDATIONS PER LANGUAGE SPACE
// ==========================================
export interface RoadmapRecommendation {
  id: string;
  languageId: string;
  title: string;
  targetLevel: string;
  learningGoal: 'COMMUNICATION' | 'CAREER' | 'EXAM' | 'TRAVEL';
  dailyStudyMinutes: number;
  estimatedDays: number;
  tag: string;
  badgeColor: string;
  description: string;
  highlightSkills: string[];
  stagesCount: number;
  totalLessons: number;
}

export const AI_ROADMAP_RECOMMENDATIONS: Record<string, RoadmapRecommendation[]> = {
  en: [
    {
      id: 'en-preset-toeic',
      languageId: 'en',
      title: 'TOEIC 750+ Bứt Phá Công Sở & Thương Mại',
      targetLevel: 'B2',
      learningGoal: 'CAREER',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🔥 Phổ biến nhất',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      description: 'Lộ trình tối ưu từ vựng công sở, họp hành, đàm phán hợp đồng và nghe hiểu hội thoại thương mại.',
      highlightSkills: ['Từ vựng Business', 'Nghe bắt từ khóa', 'Viết Email chuẩn mực'],
      stagesCount: 3,
      totalLessons: 18,
    },
    {
      id: 'en-preset-ielts',
      languageId: 'en',
      title: 'IELTS 6.5+ Academic Master Toàn Diện',
      targetLevel: 'B2',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 30,
      estimatedDays: 60,
      tag: '🎯 Chinh phục chứng chỉ',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      description: 'Luyện tư duy phản biện, từ vựng học thuật cao cấp và chiến thuật xử lý các dạng bài thi.',
      highlightSkills: ['Academic Vocabulary', 'Đọc quét Skimming', 'Tư duy logic'],
      stagesCount: 4,
      totalLessons: 24,
    },
    {
      id: 'en-preset-comm',
      languageId: 'en',
      title: 'Giao Tiếp Phản Xạ Đời Thực 21 Ngày',
      targetLevel: 'B1',
      learningGoal: 'COMMUNICATION',
      dailyStudyMinutes: 15,
      estimatedDays: 21,
      tag: '⚡ Tốc độ & Thực chiến',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: 'Xóa bỏ phản xạ dịch trong đầu, tự tin trò chuyện tự nhiên với người bản xứ trong mọi tình huống.',
      highlightSkills: ['Hội thoại đời sống', 'Phát âm IPA chuẩn', 'Cụm từ thông dụng'],
      stagesCount: 2,
      totalLessons: 14,
    },
    {
      id: 'en-preset-travel',
      languageId: 'en',
      title: 'Tiếng Anh Du Lịch & Định Cư Cấp Tốc',
      targetLevel: 'A2',
      learningGoal: 'TRAVEL',
      dailyStudyMinutes: 15,
      estimatedDays: 14,
      tag: '✈️ Du lịch & Hội nhập',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'Chỉ dẫn sân bay, đặt phòng khách sạn, giao tiếp hải quan và xử lý tình huống khẩn cấp ở nước ngoài.',
      highlightSkills: ['Hỏi đường & Đi lại', 'Thủ tục sân bay', 'Ăn uống & Mua sắm'],
      stagesCount: 2,
      totalLessons: 10,
    },
  ],

  ja: [
    {
      id: 'ja-preset-n5',
      languageId: 'ja',
      title: 'JLPT N5 Nhập Môn Toàn Diện Cấp Tốc',
      targetLevel: 'N5',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🌸 Khuyên dùng cho người mới',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      description: 'Bảng chữ Hiragana/Katakana, 100 chữ Kanji cơ bản và ngữ pháp mẫu câu sinh hoạt JLPT N5.',
      highlightSkills: ['Bảng chữ cái', '100 Kanji N5', 'Trợ từ cốt lõi'],
      stagesCount: 2,
      totalLessons: 16,
    },
    {
      id: 'ja-preset-n4',
      languageId: 'ja',
      title: 'JLPT N4 Đột Phá Ngữ Pháp & Kanji',
      targetLevel: 'N4',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 25,
      estimatedDays: 45,
      tag: '⛩️ Trung cấp vững vàng',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      description: 'Thể Te, thể Nai, thể Khả năng và phản xạ hội thoại làm việc với đồng nghiệp Nhật Bản.',
      highlightSkills: ['300 Kanji N4', 'Biến thể động từ', 'Nghe hiểu thực tế'],
      stagesCount: 3,
      totalLessons: 20,
    },
    {
      id: 'ja-preset-comm',
      languageId: 'ja',
      title: 'Tiếng Nhật Giao Tiếp Đời Sống Tokyo',
      targetLevel: 'N5',
      learningGoal: 'COMMUNICATION',
      dailyStudyMinutes: 15,
      estimatedDays: 20,
      tag: '🍣 Thực chiến đời thường',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: 'Tự tin đi tàu điện ngầm, gọi món quán Ramen, mua đồ tại Konbini và kết bạn người Nhật.',
      highlightSkills: ['Konbini & Nhà hàng', 'Đi lại tàu điện', 'Văn hóa xã giao'],
      stagesCount: 2,
      totalLessons: 12,
    },
  ],

  ko: [
    {
      id: 'ko-preset-topik1',
      languageId: 'ko',
      title: 'TOPIK I Sơ Cấp (Cấp 1-2) Nền Tảng Vững Chắc',
      targetLevel: 'TOPIK 1',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🇰🇷 Chuẩn đề thi TOPIK',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      description: 'Làm quen bảng chữ Hangul, 500 từ vựng cốt lõi và các đuôi câu -아/어요, -습니다.',
      highlightSkills: ['Hangul thần tốc', 'Đuôi câu kính ngữ', 'Từ vựng TOPIK 1'],
      stagesCount: 2,
      totalLessons: 16,
    },
    {
      id: 'ko-preset-kculture',
      languageId: 'ko',
      title: 'Phản Xạ K-Culture & Giao Tiếp Đời Sống Seoul',
      targetLevel: 'TOPIK 1',
      learningGoal: 'COMMUNICATION',
      dailyStudyMinutes: 15,
      estimatedDays: 21,
      tag: '🎬 Đu phim & Âm nhạc',
      badgeColor: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
      description: 'Hiểu lời thoại K-Drama, bắt trọn câu nói thần tượng và giao tiếp du lịch tự tin ở Seoul.',
      highlightSkills: ['Tiếng lóng thân mật', 'Hỏi đường Hongdae', 'Gọi món ẩm thực'],
      stagesCount: 2,
      totalLessons: 12,
    },
    {
      id: 'ko-preset-business',
      languageId: 'ko',
      title: 'Tiếng Hàn Doanh Nghiệp & Biên Phiên Dịch',
      targetLevel: 'TOPIK 2',
      learningGoal: 'CAREER',
      dailyStudyMinutes: 25,
      estimatedDays: 45,
      tag: '💼 Thăng tiến sự nghiệp',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'Kính ngữ doanh nghiệp trang trọng, email thương mại và quy chuẩn ứng xử công sở Hàn Quốc.',
      highlightSkills: ['Kính ngữ cấp cao', 'Viết email đối tác', 'Thuyết trình dự án'],
      stagesCount: 3,
      totalLessons: 18,
    },
  ],

  zh: [
    {
      id: 'zh-preset-hsk12',
      languageId: 'zh',
      title: 'HSK 1-2 Tự Tin Giao Tiếp Căn Bản',
      targetLevel: 'HSK 2',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🇨🇳 Nhập môn toàn diện',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      description: '300 chữ Hán thường gặp, chuẩn hóa 4 thanh điệu Pinyin và phản xạ sinh hoạt hàng ngày.',
      highlightSkills: ['Pinyin chuẩn Bắc Kinh', '300 Hán tự HSK', 'Đoán nghĩa chữ ghép'],
      stagesCount: 2,
      totalLessons: 16,
    },
    {
      id: 'zh-preset-trade',
      languageId: 'zh',
      title: 'Tiếng Trung Thương Mại & Đàm Phán Nguồn Hàng',
      targetLevel: 'HSK 2',
      learningGoal: 'CAREER',
      dailyStudyMinutes: 20,
      estimatedDays: 25,
      tag: '📈 Nhập hàng & Kinh doanh',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'Mặc cả, hỏi giá sỉ Taobao/1688, đàm phán hợp đồng vận chuyển và giao dịch nhà xưởng.',
      highlightSkills: ['Mặc cả & Hỏi giá', 'Vận chuyển logistics', 'Hợp đồng thương mại'],
      stagesCount: 2,
      totalLessons: 14,
    },
    {
      id: 'zh-preset-hsk34',
      languageId: 'zh',
      title: 'HSK 3-4 Đột Phá Hán Tự & Đọc Hiểu Nâng Cao',
      targetLevel: 'HSK 3',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 30,
      estimatedDays: 60,
      tag: '🐉 Chinh phục HSK 3+',
      badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      description: 'Làm chủ 600+ chữ Hán, cấu trúc câu phức và đọc hiểu mẩu tin tức Trung Hoa.',
      highlightSkills: ['600 Hán tự nâng cao', 'Cấu trúc câu phức', 'Nghe bắt ý nhanh'],
      stagesCount: 3,
      totalLessons: 20,
    },
  ],

  de: [
    {
      id: 'de-preset-a1a2',
      languageId: 'de',
      title: 'Goethe-Zertifikat A1-A2 Nền Tảng Du Học Đức',
      targetLevel: 'A2',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 40,
      tag: '🇩🇪 Nền tảng du học nghề',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      description: 'Nắm vững 3 giống danh từ der/die/das, 4 cách (Kasus) và giao tiếp cuộc sống hàng ngày tại Đức.',
      highlightSkills: ['der/die/das chuẩn xác', 'Akkusativ & Dativ', 'Hội thoại sinh hoạt'],
      stagesCount: 2,
      totalLessons: 16,
    },
    {
      id: 'de-preset-comm',
      languageId: 'de',
      title: 'Tiếng Đức Giao Tiếp & Hòa Nhập Cuộc Sống',
      targetLevel: 'A1',
      learningGoal: 'COMMUNICATION',
      dailyStudyMinutes: 15,
      estimatedDays: 25,
      tag: '☕ Định cư & Sinh hoạt',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: 'Đăng ký cư trú (Anmeldung), mở tài khoản ngân hàng, mua sắm siêu thị và đi lại tàu xe.',
      highlightSkills: ['Thủ tục hành chính', 'Đi lại DB Bahn', 'Giao lưu cộng đồng'],
      stagesCount: 2,
      totalLessons: 12,
    },
  ],

  fr: [
    {
      id: 'fr-preset-delf',
      languageId: 'fr',
      title: 'DELF A1-A2 Giao Tiếp Tự Tin & Phát Âm Chuẩn',
      targetLevel: 'A2',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 35,
      tag: '🇫🇷 Chuẩn khung châu Âu',
      badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      description: 'Phát âm chuẩn âm mũi, nối âm mượt mà, chia động từ nhóm 1-2-3 và ngữ pháp cơ bản.',
      highlightSkills: ['Phát âm âm mũi', 'Nối âm Liaison', 'Chia thì cơ bản'],
      stagesCount: 2,
      totalLessons: 14,
    },
    {
      id: 'fr-preset-travel',
      languageId: 'fr',
      title: 'Pháp Thoại Du Lịch & Văn Hóa Paris',
      targetLevel: 'A1',
      learningGoal: 'TRAVEL',
      dailyStudyMinutes: 15,
      estimatedDays: 20,
      tag: '🥐 Du lịch & Ẩm thực',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      description: 'Gọi món tại tiệm bánh & cà phê Paris, thăm bảo tàng Louvre và giao tiếp lịch thiệp Pháp.',
      highlightSkills: ['Ẩm thực quán xá', 'Bảo tàng & Đi lại', 'Xưng hô lịch thiệp'],
      stagesCount: 2,
      totalLessons: 10,
    },
  ],

  es: [
    {
      id: 'es-preset-dele',
      languageId: 'es',
      title: 'DELE A1-A2 Tiếng Tây Ban Nha Thực Dụng',
      targetLevel: 'A2',
      learningGoal: 'EXAM',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🇪🇸 Tiếng Tây Ban Nha phổ thông',
      badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
      description: 'Học chia động từ hiện tại, giống từ -o/-a và hội thoại đời sống Tây Ban Nha & Mỹ Latin.',
      highlightSkills: ['Chia động từ hiện tại', 'Số đếm & Giờ giấc', 'Hội thoại phản xạ'],
      stagesCount: 2,
      totalLessons: 14,
    },
  ],

  th: [
    {
      id: 'th-preset-travel',
      languageId: 'th',
      title: 'Tiếng Thái Giao Tiếp Du Lịch Bangkok 15 Ngày',
      targetLevel: 'A1',
      learningGoal: 'TRAVEL',
      dailyStudyMinutes: 15,
      estimatedDays: 15,
      tag: '🇹🇭 Sống sót du lịch Thái',
      badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      description: 'Chào hỏi lịch sự Sawasdee, trả giá chợ đêm Chatuchak, gọi đồ ăn cay/không cay và đi xe Tuk Tuk.',
      highlightSkills: ['Trả giá chợ đêm', 'Gọi đồ ăn vặt', 'Đi lại Bangkok'],
      stagesCount: 2,
      totalLessons: 10,
    },
  ],

  vi: [
    {
      id: 'vi-preset-comm',
      languageId: 'vi',
      title: 'Tiếng Việt Ứng Dụng & Giao Tiếp Đời Thực',
      targetLevel: 'B1',
      learningGoal: 'COMMUNICATION',
      dailyStudyMinutes: 20,
      estimatedDays: 30,
      tag: '🇻🇳 Phản xạ ngôn ngữ Việt',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      description: 'Thành thạo hệ thống 6 thanh điệu, xưng hô tôn ti trật tự và vốn từ vựng phong phú.',
      highlightSkills: ['6 Thanh điệu chuẩn', 'Hệ thống xưng hô', 'Thành ngữ đời thường'],
      stagesCount: 2,
      totalLessons: 14,
    },
  ],
};


export interface CurriculumQuestion {
  key: string;
  prompt: string;
  answer: string;
  options?: string[];
}

export function getCurriculumQuestions(activity: LessonActivity, index: number): CurriculumQuestion[] {
  const content = activity.content;
  if (!content) return [];
  const questions = Array.isArray(content.questions) ? content.questions : [content];
  return questions.flatMap((question, questionIndex) => {
    const prompt = question.q ?? question.question ?? question.prompt ??
      (question.target && Array.isArray(question.words) ? question.words.join(' · ') : undefined);
    const answer = question.answer ?? question.solution ?? question.target;
    if (typeof prompt !== 'string' || typeof answer !== 'string') return [];
    return [{ key: `${index}:${questionIndex}`, prompt, answer, options: question.options }];
  });
}

export function matchesCurriculumAnswer(answer: string | undefined, expected: string) {
  const normalize = (value: string) => value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  return typeof answer === 'string' && normalize(answer) === normalize(expected);
}
