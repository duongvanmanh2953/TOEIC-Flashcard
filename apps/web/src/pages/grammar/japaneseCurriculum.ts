/**
 * Authentic Japanese Grammar Curriculum (JLPT N5 - N4)
 * Provides genuine Japanese grammar points, sentence structures, authentic examples, and exercises.
 */

export const JAPANESE_GRAMMAR_CATEGORIES: any[] = [
  {
    id: 'ja-cat-particles',
    code: 'PARTICLES',
    title: 'Japanese Particles (助詞 - Joshi)',
    titleVi: 'Hệ Thống Trợ Từ Tiếng Nhật JLPT N5',
    description: 'Nắm vững các trợ từ nền tảng は, が, を, に, で trong câu tiếng Nhật.',
    languageId: 'ja',
    orderIndex: 1,
    topics: [
      {
        id: 'ja-topic-wa-ga',
        title: 'Particles は (wa) & が (ga)',
        titleVi: 'Trợ từ Chủ đề は & Trợ từ Chủ ngữ が',
        summary: 'Phân biệt chủ đề của câu (Topic Marker) và chủ ngữ trực tiếp (Subject Marker).',
        cefrLevel: 'A1 / N5',
        orderIndex: 1,
        ruleCount: 2,
        exerciseCount: 3,
        masteryScore: 0,
        attemptCount: 0,
        lastStudiedAt: null,
        nextReviewAt: null,
      },
      {
        id: 'ja-topic-wo-ni-de',
        title: 'Particles を, に, で (Object & Location)',
        titleVi: 'Trợ từ Tân ngữ を, Đích đến に & Địa điểm で',
        summary: 'Cách dùng trợ từ tân ngữ, địa điểm hành động và thời gian xác định.',
        cefrLevel: 'A1 / N5',
        orderIndex: 2,
        ruleCount: 2,
        exerciseCount: 3,
        masteryScore: 0,
        attemptCount: 0,
        lastStudiedAt: null,
        nextReviewAt: null,
      },
    ],
  },
  {
    id: 'ja-cat-verbs',
    code: 'VERB_CONJUGATION',
    title: 'Verbs & Polite Forms (です・ます調)',
    titleVi: 'Thể Lịch Sự & Cấu Trúc Câu Cơ Bản',
    description: 'Quy tắc chia động từ thể ます, phủ định, quá khứ và thể mong muốn たい.',
    languageId: 'ja',
    orderIndex: 2,
    topics: [
      {
        id: 'ja-topic-desu-masu',
        title: 'Polite Forms: です・ます・でした・ました',
        titleVi: 'Thể Khẳng Định, Phủ Định & Quá Khứ Lịch Sự',
        summary: 'Cấu trúc câu khẳng định, phủ định và thời quá khứ căn bản trong giao tiếp.',
        cefrLevel: 'A1 / N5',
        orderIndex: 1,
        ruleCount: 2,
        exerciseCount: 3,
        masteryScore: 0,
        attemptCount: 0,
        lastStudiedAt: null,
        nextReviewAt: null,
      },
      {
        id: 'ja-topic-tai-form',
        title: 'Desire Form: 〜たい (Want to do)',
        titleVi: 'Cấu Trúc Mong Muốn: 〜たい です',
        summary: 'Diễn tả nguyện vọng, ý muốn làm một việc gì đó của bản thân.',
        cefrLevel: 'A1 / N5',
        orderIndex: 2,
        ruleCount: 1,
        exerciseCount: 3,
        masteryScore: 0,
        attemptCount: 0,
        lastStudiedAt: null,
        nextReviewAt: null,
      },
    ],
  },
];

export const JAPANESE_GRAMMAR_TOPIC_DETAILS: Record<string, any> = {
  'ja-topic-wa-ga': {
    id: 'ja-topic-wa-ga',
    title: 'Particles は (wa) & が (ga)',
    titleVi: 'Trợ từ Chủ đề は & Trợ từ Chủ ngữ が',
    summary: 'Phân biệt chủ đề của câu (Topic Marker) và chủ ngữ trực tiếp (Subject Marker).',
    cefrLevel: 'N5',
    category: {
      id: 'ja-cat-particles',
      title: 'Japanese Particles',
      titleVi: 'Trợ Từ Tiếng Nhật',
    },
    rules: [
      {
        id: 'rule-wa-1',
        title: '1. Trợ từ は (đọc là wa khi làm trợ từ)',
        explanationMd: 'Trợ từ は được dùng để đưa danh từ phía trước lên làm chủ đề chính của câu (Nói về X thì...). Vị ngữ phía sau sẽ giải thích hoặc cung cấp thông tin về chủ đề đó.',
        structuresJson: [
          'Chủ đề は + Danh từ / Tính từ です',
          'わたし は がくせい です (Tôi là học sinh)',
          'これ は にほん の ほんです (Đây là cuốn sách tiếng Nhật)',
        ],
        commonMistakes: [
          'Phát âm nhầm âm của trợ từ は thành "ha". Khi là trợ từ, bắt buộc đọc là "wa".',
          'Dùng は ở mệnh đề phụ thay vì が.',
        ],
        examples: [
          {
            id: 'ex-wa-1',
            sentence: 'わたし は ベトナムじん です。',
            translation: 'Tôi là người Việt Nam.',
            breakdownMd: 'わたし (Tôi) + は (trợ từ chủ đề) + ベトナムじん (người Việt Nam) + です (là).',
          },
          {
            id: 'ex-wa-2',
            sentence: 'きょう は いい てんき です ね。',
            translation: 'Hôm nay thời tiết đẹp nhỉ.',
            breakdownMd: 'きょう (Hôm nay) + は (chủ đề) + いい てんき (thời tiết tốt) + です ね.',
          },
        ],
      },
      {
        id: 'rule-ga-1',
        title: '2. Trợ từ が (ga) - Chủ ngữ hành động & Câu tồn tại',
        explanationMd: 'Trợ từ が nhấn mạnh chính đối tượng đứng trước nó (ai/cái gì). Đặc biệt bắt buộc đi với động từ chỉ sự tồn tại あります (đồ vật) và います (người, động vật).',
        structuresJson: [
          '[Danh từ] が あります (Có đồ vật)',
          '[Danh từ] が います (Có người / động vật)',
          '[Ai đó] が [Hành động]',
        ],
        commonMistakes: [
          'Nhầm lẫn giữa あります (dùng cho vật vô tri) và います (dùng cho sinh vật sống).',
        ],
        examples: [
          {
            id: 'ex-ga-1',
            sentence: 'へや に ねこ が います。',
            translation: 'Trong phòng có một con mèo.',
            breakdownMd: 'へや (phòng) + に (ở) + ねこ (mèo) + が (trợ từ) + います (có/tồn tại).',
          },
          {
            id: 'ex-ga-2',
            sentence: 'あめ が ふっています。',
            translation: 'Trời đang mưa.',
            breakdownMd: 'あめ (mưa) + が (chủ ngữ tự nhiên) + ふっています (đang rơi).',
          },
        ],
      },
    ],
    exercises: [
      {
        id: 'ja-ex-1',
        questionText: 'わたし ___ たなか です。(Điền trợ từ thích hợp)',
        questionType: 'MULTIPLE_CHOICE',
        options: ['は', 'が', 'を', 'に'],
        difficulty: 1,
        correctAnswer: 'は',
        explanationMd: 'Dùng trợ từ は để xác định chủ đề giới thiệu tên: わたしはたなかです (Tôi là Tanaka).',
      },
      {
        id: 'ja-ex-2',
        questionText: 'つくえ の うえ に ほん ___ あります。',
        questionType: 'MULTIPLE_CHOICE',
        options: ['が', 'は', 'で', 'を'],
        difficulty: 1,
        correctAnswer: 'が',
        explanationMd: 'Cấu trúc chỉ sự tồn tại của đồ vật đi với trợ từ が: N が あります (Có cuốn sách).',
      },
      {
        id: 'ja-ex-3',
        questionText: 'にわ に いぬ ___ います。',
        questionType: 'MULTIPLE_CHOICE',
        options: ['が', 'を', 'に', 'は'],
        difficulty: 1,
        correctAnswer: 'が',
        explanationMd: 'Chó (いぬ) là sinh vật sống, đi với trợ từ が và động từ います.',
      },
    ],
  },
  'ja-topic-wo-ni-de': {
    id: 'ja-topic-wo-ni-de',
    title: 'Particles を, に, で (Object & Location)',
    titleVi: 'Trợ từ Tân ngữ を, Đích đến に & Địa điểm で',
    summary: 'Cách dùng trợ từ tân ngữ, địa điểm hành động và thời gian xác định.',
    cefrLevel: 'N5',
    category: {
      id: 'ja-cat-particles',
      title: 'Japanese Particles',
      titleVi: 'Trợ Từ Tiếng Nhật',
    },
    rules: [
      {
        id: 'rule-wo-1',
        title: 'Trợ từ を (đọc là o) - Tân ngữ trực tiếp',
        explanationMd: 'Trợ từ を đứng sau danh từ để chỉ đối tượng chịu tác động của hành động.',
        structuresJson: [
          '[Tân ngữ] を + Động từ',
          'みず を のみます (Uống nước)',
          'ごはん を たべます (Ăn cơm)',
        ],
        commonMistakes: [
          'Dùng を với các động từ tự thân (tự động từ) hoặc tính từ thích/ghét (phải dùng が).',
        ],
        examples: [
          {
            id: 'ex-wo-1',
            sentence: 'まいあさ、みず を のみます。',
            translation: 'Mỗi sáng tôi đều uống nước.',
            breakdownMd: 'まいあさ (mỗi sáng) + みず (nước) + を (tân ngữ) + のみます (uống).',
          },
        ],
      },
      {
        id: 'rule-de-ni-1',
        title: 'Trợ từ で (nơi diễn ra hành động) & に (đích đến / thời gian)',
        explanationMd: 'Trợ từ で chỉ địa điểm diễn ra hành động. Trợ từ に chỉ địa điểm đích đến (với đi/đến/về) hoặc thời gian có số cụ thể.',
        structuresJson: [
          '[Địa điểm] で + Hành động (Làm gì ở đâu)',
          '[Địa điểm] に + いきます / きます (Đi / đến đâu)',
          '[Thời gian cụ thể] に + Hành động (Làm gì lúc mấy giờ)',
        ],
        commonMistakes: [
          'Nhầm lẫn giữa で (làm việc gì tại đâu) và に (tồn tại ở đâu hoặc đi đến đâu).',
        ],
        examples: [
          {
            id: 'ex-de-1',
            sentence: 'としょかん で ほん を よみます。',
            translation: 'Tôi đọc sách ở thư viện.',
            breakdownMd: 'としょかん (thư viện) + で (tại) + ほん (sách) + を + よみます (đọc).',
          },
          {
            id: 'ex-ni-1',
            sentence: 'まいあさ ７じ に おきます。',
            translation: 'Mỗi sáng tôi thức dậy lúc 7 giờ.',
            breakdownMd: '７じ (7 giờ) có mốc thời gian cụ thể nên đi với trợ từ に.',
          },
        ],
      },
    ],
    exercises: [
      {
        id: 'ja-ex-4',
        questionText: 'レストラン ___ ひるごはん を たべました。',
        questionType: 'MULTIPLE_CHOICE',
        options: ['で', 'に', 'を', 'は'],
        difficulty: 1,
        correctAnswer: 'で',
        explanationMd: 'Nơi diễn ra hành động ăn cơm trưa (レストラン - nhà hàng) dùng trợ từ で.',
      },
      {
        id: 'ja-ex-5',
        questionText: 'あした、とうきょう ___ いきます。',
        questionType: 'MULTIPLE_CHOICE',
        options: ['に', 'で', 'を', 'から'],
        difficulty: 1,
        correctAnswer: 'に',
        explanationMd: 'Đích đến của hành động di chuyển (いきます - đi) dùng trợ từ に (hoặc へ).',
      },
      {
        id: 'ja-ex-6',
        questionText: 'まいばん、おんがく ___ ききます。',
        questionType: 'MULTIPLE_CHOICE',
        options: ['を', 'に', 'で', 'が'],
        difficulty: 1,
        correctAnswer: 'を',
        explanationMd: 'Nghe nhạc: おんがく (nhạc) là đối tượng của động từ ききます (nghe) -> dùng trợ từ を.',
      },
    ],
  },
  'ja-topic-desu-masu': {
    id: 'ja-topic-desu-masu',
    title: 'Polite Forms: です・ます・でした・ました',
    titleVi: 'Thể Khẳng Định, Phủ Định & Quá Khứ Lịch Sự',
    summary: 'Cấu trúc câu khẳng định, phủ định và thời quá khứ căn bản trong giao tiếp.',
    cefrLevel: 'N5',
    category: {
      id: 'ja-cat-verbs',
      title: 'Verbs & Polite Forms',
      titleVi: 'Thể Lịch Sự & Cấu Trúc Động Từ',
    },
    rules: [
      {
        id: 'rule-masu-1',
        title: 'Bảng chia thể ます căn bản',
        explanationMd: 'Động từ trong tiếng Nhật ở thể lịch sự chia theo 4 dạng: Hiện tại khẳng định (ます), Hiện tại phủ định (ません), Quá khứ khẳng định (ました), Quá khứ phủ định (ませんでした).',
        structuresJson: [
          'Khẳng định: V-ます (たべます - ăn)',
          'Phủ định: V-ません (たべません - không ăn)',
          'Quá khứ: V-ました (たべました - đã ăn)',
          'Quá khứ phủ định: V-ませんでした (たべませんでした - đã không ăn)',
        ],
        commonMistakes: [
          'Quên biến đổi quá khứ khi câu có từ chỉ thời gian quá khứ như きのう (hôm qua), せんしゅう (tuần trước).',
        ],
        examples: [
          {
            id: 'ex-masu-1',
            sentence: 'きのう、にほんご を べんきょう しました。',
            translation: 'Hôm qua tôi đã học tiếng Nhật.',
            breakdownMd: 'きのう (hôm qua) là quá khứ nên động từ べんきょうします chuyển thành べんきょうしました.',
          },
        ],
      },
    ],
    exercises: [
      {
        id: 'ja-ex-7',
        questionText: 'きのう わたし は えいが を ___ (đã xem).',
        questionType: 'MULTIPLE_CHOICE',
        options: ['みました', 'みます', 'みません', 'みませんでした'],
        difficulty: 1,
        correctAnswer: 'みました',
        explanationMd: 'Thời gian là "きのう" (hôm qua) và mang nghĩa khẳng định "đã xem", nên chia thành みました.',
      },
      {
        id: 'ja-ex-8',
        questionText: 'あした は がっこう へ ___ (không đi).',
        questionType: 'MULTIPLE_CHOICE',
        options: ['いきません', 'いきました', 'いきます', 'いきませんでした'],
        difficulty: 1,
        correctAnswer: 'いきません',
        explanationMd: 'Thời gian là "あした" (ngày mai) mang nghĩa phủ định tương lai -> いきません.',
      },
    ],
  },
  'ja-topic-tai-form': {
    id: 'ja-topic-tai-form',
    title: 'Desire Form: 〜たい (Want to do)',
    titleVi: 'Cấu Trúc Mong Muốn: 〜たい です',
    summary: 'Diễn tả nguyện vọng, ý muốn làm một việc gì đó của bản thân.',
    cefrLevel: 'N5',
    category: {
      id: 'ja-cat-verbs',
      title: 'Verbs & Polite Forms',
      titleVi: 'Thể Lịch Sự & Cấu Trúc Động Từ',
    },
    rules: [
      {
        id: 'rule-tai-1',
        title: 'Cấu trúc V-たい です',
        explanationMd: 'Bỏ đuôi ます của động từ rồi thêm たい です để diễn đạt mong muốn của người nói (Tôi muốn...). Phủ định là たくありません (Không muốn...).',
        structuresJson: [
          'V (bỏ ます) + たい です (Muốn làm V)',
          'V (bỏ ます) + たくありません (Không muốn làm V)',
          'にほん へ いきたい です (Tôi muốn đi Nhật Bản)',
        ],
        commonMistakes: [
          'Không dùng たい です để hỏi trực tiếp mong muốn của người trên (vì mang tính tọc mạch, thiếu lịch sự).',
        ],
        examples: [
          {
            id: 'ex-tai-1',
            sentence: 'にほん の すし を たべたい です。',
            translation: 'Tôi muốn ăn sushi Nhật Bản.',
            breakdownMd: 'たべます -> たべたい です (muốn ăn).',
          },
        ],
      },
    ],
    exercises: [
      {
        id: 'ja-ex-9',
        questionText: 'つめたい みず を ___ です。(muốn uống)',
        questionType: 'MULTIPLE_CHOICE',
        options: ['のみたい', 'のみます', 'のむ', 'のんだ'],
        difficulty: 1,
        correctAnswer: 'のみたい',
        explanationMd: 'Động từ のみます bỏ ます + たい -> のみたい です (muốn uống).',
      },
    ],
  },
};
