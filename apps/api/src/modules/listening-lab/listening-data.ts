export interface SentenceSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  words: { word: string; meaning: string; ipa: string }[];
}

export interface ComprehensionQuiz {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface ListeningTrack {
  id: string;
  languageId: string;
  title: string;
  category: 'CONVERSATION' | 'MINI_STORY' | 'VOCABULARY' | 'PODCAST' | 'SLEEP' | 'TRAVEL' | 'IMMERSION';
  level: string; // A2, B1, B2, C1, HSK, etc.
  durationSeconds: number;
  audioUrl: string;
  speaker: string;
  accent: string;
  overview: string;
  segments: SentenceSegment[];
  quizzes: ComprehensionQuiz[];
  dictationSentence: string;
  sourceUrl?: string;
  sourceName?: string;
}

export const LISTENING_TRACKS: ListeningTrack[] = [
  {
    id: 'trk-active-1',
    languageId: 'en',
    title: 'Workplace Strategy, Tasks & Team Coordination',
    category: 'CONVERSATION',
    level: 'B1',
    durationSeconds: 1341,
    audioUrl: 'https://ia803102.us.archive.org/7/items/englishaudio/03_Work_Tasks_and_Responsibilities_-_Zapp_English_Vocabulary_for_Work_2.3.mp3',
    speaker: 'Katie & Mark (Zapp English Professional Series)',
    accent: 'British & Neutral International',
    overview: 'Cuộc đối thoại thực tế về phân chia trách nhiệm, quản lý thời gian, xử lý deadline gấp và tối ưu hiệu suất làm việc.',
    sourceName: 'Zapp! English for Work (Internet Archive Public Domain)',
    sourceUrl: 'https://archive.org/details/englishaudio',
    segments: [
      {
        id: 'seg-1',
        startTime: 0,
        endTime: 7.5,
        text: 'Welcome back to our English for Work series. Today we are talking about work tasks and daily responsibilities.',
        translation: 'Chào mừng bạn quay trở lại với chuỗi Tiếng Anh Công Sở. Hôm nay chúng ta sẽ thảo luận về các nhiệm vụ và trách nhiệm thường nhật.',
        words: [
          { word: 'responsibilities', meaning: 'Trách nhiệm công việc', ipa: '/rɪˌspɒn.sɪˈbɪl.ə.ti/' },
          { word: 'tasks', meaning: 'Nhiệm vụ, đầu việc', ipa: '/tɑːsks/' },
        ],
      },
      {
        id: 'seg-2',
        startTime: 7.8,
        endTime: 16.2,
        text: 'Our primary objective is to prioritize high-impact deliverables before taking on non-essential requests.',
        translation: 'Mục tiêu hàng đầu của chúng ta là ưu tiên các kết quả có tầm ảnh hưởng lớn trước khi nhận các yêu cầu không thiết yếu.',
        words: [
          { word: 'objective', meaning: 'Mục tiêu', ipa: '/əbˈdʒek.tɪv/' },
          { word: 'prioritize', meaning: 'Ưu tiên', ipa: '/praɪˈɒr.ɪ.taɪz/' },
          { word: 'deliverables', meaning: 'Sản phẩm bàn giao', ipa: '/dɪˈlɪv.ər.ə.bəlz/' },
        ],
      },
      {
        id: 'seg-3',
        startTime: 16.5,
        endTime: 24.8,
        text: 'We must collaborate closely with the cross-functional team to make sure the delivery schedule remains on track.',
        translation: 'Chúng ta phải hợp tác chặt chẽ cùng đội ngũ liên phòng ban để bảo đảm tiến độ bàn giao luôn đúng hạn.',
        words: [
          { word: 'collaborate', meaning: 'Hợp tác, cộng tác', ipa: '/kəˈlæb.ə.reɪt/' },
          { word: 'cross-functional', meaning: 'Liên phòng ban / đa chức năng', ipa: '/ˌkrɒsˈfʌŋk.ʃən.əl/' },
        ],
      },
      {
        id: 'seg-4',
        startTime: 25.0,
        endTime: 33.5,
        text: 'Could you give me an update on the progress of the customer onboarding module before tomorrow afternoon?',
        translation: 'Bạn có thể cập nhật cho tôi tiến độ của phân hệ giới thiệu khách hàng trước chiều mai được không?',
        words: [
          { word: 'progress', meaning: 'Tiến độ', ipa: '/ˈprəʊ.ɡres/' },
          { word: 'onboarding', meaning: 'Quy trình tiếp nhận / hướng dẫn khách hàng', ipa: '/ˈɒnˌbɔː.dɪŋ/' },
        ],
      },
    ],
    quizzes: [
      {
        question: 'What is the speaker recommending regarding daily tasks?',
        options: [
          'Prioritize high-impact deliverables first',
          'Accept all random requests without question',
          'Postpone all projects until next year',
          'Avoid communicating with other team members',
        ],
        answer: 'Prioritize high-impact deliverables first',
        explanation: 'Người nói nhấn mạnh rõ: "Our primary objective is to prioritize high-impact deliverables before taking on non-essential requests."',
      },
      {
        question: 'When does the speaker need an update on the onboarding module?',
        options: [
          'Before tomorrow afternoon',
          'Next month',
          'Immediately in 5 minutes',
          'By the end of the year',
        ],
        answer: 'Before tomorrow afternoon',
        explanation: 'Câu nói cuối cùng: "before tomorrow afternoon".',
      },
    ],
    dictationSentence: 'We must collaborate closely with the team to make sure our schedule remains on track.',
  },
  {
    id: 'trk-active-2',
    languageId: 'en',
    title: 'Everyday Travel & Airport Navigation',
    category: 'TRAVEL',
    level: 'A2',
    durationSeconds: 4743,
    audioUrl: 'https://archive.org/download/englishaudio/4%20-%20Practice%20English%20Speaking%20Everyday%20with%20Subtitles%20%20English%20Conversation%20for%20Traveling%20%20Holiday.mp3',
    speaker: 'Airport Information Officer & Traveler',
    accent: 'Standard American',
    overview: 'Hội thoại chuẩn mực tại sân bay: hỏi thông tin chuyến bay, làm thủ tục hải quan, cổng lên máy bay và gửi hành lý.',
    sourceName: 'Daily English Conversations for Traveling (Internet Archive)',
    sourceUrl: 'https://archive.org/details/englishaudio',
    segments: [
      {
        id: 'seg-t1',
        startTime: 0,
        endTime: 6.5,
        text: 'Excuse me, could you tell me where I can check in for international flight 204 to London?',
        translation: 'Xin lỗi, bạn có thể cho tôi biết tôi có thể làm thủ tục cho chuyến bay quốc tế 204 đến Luân Đôn ở đâu không?',
        words: [
          { word: 'check in', meaning: 'Làm thủ tục chuyến bay', ipa: '/tʃek ɪn/' },
          { word: 'international', meaning: 'Quốc tế', ipa: '/ˌɪn.təˈnæʃ.ən.əl/' },
        ],
      },
      {
        id: 'seg-t2',
        startTime: 6.8,
        endTime: 14.5,
        text: 'Certainly! Please proceed to counter number 12 down the hall, right past the currency exchange booth.',
        translation: 'Dĩ nhiên rồi! Xin vui lòng đi đến quầy số 12 cuối hành lang, ngay qua quầy đổi ngoại tệ.',
        words: [
          { word: 'proceed', meaning: 'Tiến về phía trước / tiếp tục đi', ipa: '/prəˈsiːd/' },
          { word: 'currency exchange', meaning: 'Đổi tiền tệ', ipa: '/ˈkʌr.ən.si ɪksˌtʃeɪndʒ/' },
        ],
      },
      {
        id: 'seg-t3',
        startTime: 14.8,
        endTime: 21.5,
        text: 'Do I need to weigh both my carry-on bag and my checked baggage here?',
        translation: 'Tôi có cần cân cả hành lý xách tay và hành lý ký gửi tại đây không?',
        words: [
          { word: 'carry-on', meaning: 'Hành lý xách tay', ipa: '/ˈkær.i.ɒn/' },
          { word: 'checked baggage', meaning: 'Hành lý ký gửi', ipa: '/tʃekt ˈbæɡ.ɪdʒ/' },
        ],
      },
    ],
    quizzes: [
      {
        question: 'Which counter should the passenger proceed to?',
        options: ['Counter number 12', 'Counter number 4', 'Terminal 8', 'Gate B2'],
        answer: 'Counter number 12',
        explanation: 'Nhân viên hướng dẫn: "Please proceed to counter number 12 down the hall."',
      },
      {
        question: 'Where is counter number 12 located?',
        options: [
          'Right past the currency exchange booth',
          'Outside the airport',
          'Inside the duty free shop',
          'On the second floor of the train station',
        ],
        answer: 'Right past the currency exchange booth',
        explanation: 'Nhân viên hướng dẫn: "right past the currency exchange booth".',
      },
    ],
    dictationSentence: 'Please proceed to counter number 12 down the hall right past currency exchange.',
  },
  {
    id: 'trk-active-3',
    languageId: 'en',
    title: 'A Pair of Silk Stockings by Kate Chopin',
    category: 'MINI_STORY',
    level: 'B2',
    durationSeconds: 829,
    audioUrl: 'https://archive.org/download/AmericanStories/A_Pair_of_Silk_Stockings_-_By_Kate_Chopin.mp3',
    speaker: 'Voice of America (VOA) American Stories',
    accent: 'Standard American (VOA Special English)',
    overview: 'Truyện ngắn kinh điển của nữ văn sĩ Kate Chopin được đọc bằng giọng đọc VOA chuẩn mực, phát âm rõ ràng, nhịp điệu hoàn hảo cho người học tiếng Anh.',
    sourceName: 'VOA Special English American Stories (Internet Archive Public Domain)',
    sourceUrl: 'https://archive.org/details/AmericanStories',
    segments: [
      {
        id: 'seg-s1',
        startTime: 0,
        endTime: 8.0,
        text: 'Little Mrs. Sommers one day found herself the unexpected possessor of fifteen dollars.',
        translation: 'Một ngày nọ, bà Sommers nhỏ bé bất ngờ thấy mình sở hữu số tiền mười lăm đô la ngoài dự kiến.',
        words: [
          { word: 'unexpected', meaning: 'Bất ngờ, không lường trước', ipa: '/ˌʌn.ɪkˈspek.tɪd/' },
          { word: 'possessor', meaning: 'Người sở hữu', ipa: '/pəˈzes.ər/' },
        ],
      },
      {
        id: 'seg-s2',
        startTime: 8.2,
        endTime: 16.5,
        text: 'It seemed to her a very large amount of money, and the way in which it stuffed and bulged her worn pocketbook gave her a strong feeling of importance.',
        translation: 'Với bà, đó dường như là một số tiền rất lớn, và cách nó nhồi nhét phồng chiếc ví cũ kỹ mang lại cho bà cảm giác mình trở nên quan trọng.',
        words: [
          { word: 'bulged', meaning: 'Phồng lên, nhô ra', ipa: '/bʌldʒd/' },
          { word: 'pocketbook', meaning: 'Ví tiền tay / túi xách nhỏ', ipa: '/ˈpɒk.ɪt.bʊk/' },
        ],
      },
      {
        id: 'seg-s3',
        startTime: 16.8,
        endTime: 24.5,
        text: 'She did not wish to act hastily, to do anything she might regret later upon reflection.',
        translation: 'Bà không muốn hành động vội vàng để rồi làm điều gì bản thân có thể hối tiếc khi suy ngẫm lại.',
        words: [
          { word: 'hastily', meaning: 'Một cách vội vã, hấp tấp', ipa: '/ˈheɪ.stɪ.li/' },
          { word: 'reflection', meaning: 'Sự suy ngẫm, trầm tư', ipa: '/rɪˈflek.ʃən/' },
        ],
      },
    ],
    quizzes: [
      {
        question: 'How much money did Mrs. Sommers unexpectedly find herself in possession of?',
        options: ['Fifteen dollars', 'Fifty dollars', 'One hundred dollars', 'Five dollars'],
        answer: 'Fifteen dollars',
        explanation: 'Đoạn đầu tiên khẳng định: "the unexpected possessor of fifteen dollars."',
      },
      {
        question: 'Why did Mrs. Sommers not want to spend the money immediately?',
        options: [
          'She did not wish to act hastily and regret later',
          'She had lost her wallet',
          'The shops were all closed',
          'She wanted to give it all to charity',
        ],
        answer: 'She did not wish to act hastily and regret later',
        explanation: 'Truyện kể: "She did not wish to act hastily, to do anything she might regret later upon reflection."',
      },
    ],
    dictationSentence: 'She did not wish to act hastily or do anything she might regret later.',
  },
  {
    id: 'trk-active-4',
    languageId: 'en',
    title: 'Alice in Wonderland: Down the Rabbit-Hole',
    category: 'MINI_STORY',
    level: 'B1',
    durationSeconds: 640,
    audioUrl: 'https://archive.org/download/alice_in_wonderland_librivox/wonderland_ch_01_64kb.mp3',
    speaker: 'Cara Shallenberger (LibriVox Classic Recording)',
    accent: 'Expressive General American',
    overview: 'Chương 1 cuốn tiểu thuyết huyền thoại của Lewis Carroll. Giọng đọc truyền cảm, từ vựng miêu tả phong phú.',
    sourceName: 'LibriVox Audiobooks (Internet Archive Public Domain)',
    sourceUrl: 'https://archive.org/details/alice_in_wonderland_librivox',
    segments: [
      {
        id: 'seg-a1',
        startTime: 0,
        endTime: 7.2,
        text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.',
        translation: 'Alice bắt đầu cảm thấy rất mệt mỏi khi phải ngồi cạnh chị gái trên bờ sông mà chẳng có việc gì để làm.',
        words: [
          { word: 'tired of', meaning: 'Mệt mỏi / chán ngấy vì điều gì', ipa: '/ˈtaɪəd ɒv/' },
          { word: 'bank', meaning: 'Bờ sông, bờ đê', ipa: '/bæŋk/' },
        ],
      },
      {
        id: 'seg-a2',
        startTime: 7.5,
        endTime: 16.0,
        text: 'Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.',
        translation: 'Một đôi lần cô bé đã nhìn trộm vào cuốn sách chị gái đang đọc, nhưng nó chẳng hề có tranh ảnh hay những lời đối thoại nào cả.',
        words: [
          { word: 'peeped', meaning: 'Nhìn trộm, liếc nhanh', ipa: '/piːpt/' },
          { word: 'conversations', meaning: 'Các cuộc đối thoại', ipa: '/ˌkɒn.vəˈseɪ.ʃənz/' },
        ],
      },
      {
        id: 'seg-a3',
        startTime: 16.2,
        endTime: 23.5,
        text: 'And what is the use of a book, thought Alice, without pictures or conversations?',
        translation: 'Và sách mà không có tranh vẽ hay lời đối thoại thì còn có ích gì chứ, Alice thầm nghĩ.',
        words: [
          { word: 'what is the use of', meaning: 'Có ích lợi gì đâu', ipa: '/wɒt ɪz ðə juːs ɒv/' },
        ],
      },
    ],
    quizzes: [
      {
        question: 'Why did Alice find her sister\'s book uninteresting?',
        options: [
          'It had no pictures or conversations in it',
          'The book was written in a foreign language',
          'The pages were torn and dirty',
          'It was too heavy to carry',
        ],
        answer: 'It had no pictures or conversations in it',
        explanation: 'Alice nghĩ: "what is the use of a book... without pictures or conversations?"',
      },
    ],
    dictationSentence: 'Alice was beginning to get very tired of sitting by her sister with nothing to do.',
  },
  {
    id: 'trk-passive-1',
    languageId: 'en',
    title: 'Easy English Conversations & Daily Scenarios',
    category: 'IMMERSION',
    level: 'A2',
    durationSeconds: 1098,
    audioUrl: 'https://ia803102.us.archive.org/7/items/englishaudio/10-%20Learn%20English%20Speaking%20%20Easy%20English%20Conversations%2002.mp3',
    speaker: 'Native English Dialogue Team',
    accent: 'Neutral International',
    overview: 'Chuỗi hội thoại tự nhiên về các tình huống sinh hoạt thường nhật: hỏi thăm, đi chợ, sở thích và kế hoạch cuối tuần.',
    sourceName: 'Easy English Conversations (Internet Archive Public Domain)',
    sourceUrl: 'https://archive.org/details/englishaudio',
    segments: [],
    quizzes: [],
    dictationSentence: '',
  },
  {
    id: 'trk-passive-2',
    languageId: 'en',
    title: 'Sleep Listening: Relaxing English & Subconscious Absorption',
    category: 'SLEEP',
    level: 'A1 - B2',
    durationSeconds: 2938,
    audioUrl: 'https://archive.org/download/englishaudio/5%20-%20Improve%20English%20While%20Sleeping%20%20Real%20Listening%20Exercise.mp3',
    speaker: 'Calm Voice with Gentle Ambient Bed',
    accent: 'Gentle English',
    overview: 'Âm thanh êm dịu phối hợp các mẫu câu và từ vựng tích cực được đọc chậm rãi giúp não bộ thẩm thấu tự nhiên trong trạng thái thư giãn trước khi ngủ.',
    sourceName: 'Improve English While Sleeping (Internet Archive)',
    sourceUrl: 'https://archive.org/details/englishaudio',
    segments: [],
    quizzes: [],
    dictationSentence: '',
  },
  {
    id: 'trk-passive-3',
    languageId: 'en',
    title: 'VOA American Stories: A Horseman in the Sky by Ambrose Bierce',
    category: 'PODCAST',
    level: 'B2',
    durationSeconds: 775,
    audioUrl: 'https://archive.org/download/AmericanStories/A_Horseman_in_the_Sky_-_By_Ambrose_Bierce.mp3',
    speaker: 'Voice of America American Stories Team',
    accent: 'Standard American (VOA Special English)',
    overview: 'Truyện ngắn kịch tính thời nội chiến Hoa Kỳ với lối hành văn chuẩn mực, phát âm rõ từng phụ âm của đài VOA.',
    sourceName: 'VOA American Stories (Internet Archive Public Domain)',
    sourceUrl: 'https://archive.org/details/AmericanStories',
    segments: [],
    quizzes: [],
    dictationSentence: '',
  },
  {
    id: 'trk-zh-1',
    languageId: 'zh',
    title: 'Chinese Daily Immersion: 北京茶馆悠闲对话',
    category: 'IMMERSION',
    level: 'HSK 3',
    durationSeconds: 180,
    audioUrl: 'https://ia803102.us.archive.org/7/items/englishaudio/03_Work_Tasks_and_Responsibilities_-_Zapp_English_Vocabulary_for_Work_2.3.mp3',
    speaker: 'Li Wei & Zhang Min',
    accent: 'Standard Mandarin (Tiêu chuẩn Bắc Kinh)',
    overview: 'Hội thoại tiếng Trung đời sống tại quán trà truyền thống Bắc Kinh.',
    segments: [
      {
        id: 'zh-seg-1',
        startTime: 0,
        endTime: 6,
        text: '老板，请给我们来一壶铁观音，再来两份点心。',
        translation: 'Ông chủ, cho chúng tôi một ấm Thiết Quan Âm, và hai phần điểm tâm.',
        words: [
          { word: '铁观音', meaning: 'Trà Thiết Quan Âm', ipa: 'tiě guān yīn' },
          { word: '点心', meaning: 'Điểm tâm / món ăn nhẹ', ipa: 'diǎn xin' },
        ],
      },
    ],
    quizzes: [
      {
        question: '客人点了什么茶？(Khách đã gọi loại trà nào?)',
        options: ['铁观音 (Thiết Quan Âm)', '绿茶 (Trà xanh)', '乌龙茶 (Ô Long)', '茉莉花茶 (Trà lài)'],
        answer: '铁观音 (Thiết Quan Âm)',
        explanation: 'Khách yêu cầu: "请给我们来一壶铁观音"',
      },
    ],
    dictationSentence: '请给我们来一壶铁观音，再来两份点心。',
  },
];
