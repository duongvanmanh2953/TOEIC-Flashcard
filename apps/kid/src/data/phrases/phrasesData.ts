// ============================================================================
// KIDS DAILY CONVERSATION PHRASES DATA
// Daily conversational English phrases for children, family & polite habits
// ============================================================================

export interface KidPhrase {
  id: string;
  categoryVi: string;
  pronunciationTip: string;
  english: string;
  vietnamese: string;
  contextVi: string;
}

export const DAILY_PHRASES: KidPhrase[] = [
  {
    id: 'phrase_good_morning',
    categoryVi: 'Chào hỏi',
    pronunciationTip: '/ɡʊd ˈmɔː.nɪŋ/',
    english: 'Good morning!',
    vietnamese: 'Chào buổi sáng!',
    contextVi: 'Nói với bố mẹ và thầy cô khi thức dậy hoặc đến lớp.',
  },
  {
    id: 'phrase_how_are_you',
    categoryVi: 'Hỏi thăm',
    pronunciationTip: '/haʊ ɑːr juː/',
    english: 'How are you?',
    vietnamese: 'Bạn có khỏe không?',
    contextVi: 'Hỏi thăm bạn bè hoặc người thân khi gặp gỡ.',
  },
  {
    id: 'phrase_thank_you',
    categoryVi: 'Lễ phép',
    pronunciationTip: '/θæŋk juː/',
    english: 'Thank you very much!',
    vietnamese: 'Con cảm ơn rất nhiều!',
    contextVi: 'Nói khi nhận được quà, sự giúp đỡ hoặc lời khen.',
  },
  {
    id: 'phrase_you_are_welcome',
    categoryVi: 'Lễ phép',
    pronunciationTip: '/jɔːr ˈwel.kəm/',
    english: "You're welcome!",
    vietnamese: 'Không có chi đâu ạ!',
    contextVi: 'Đáp lại khi có ai đó cảm ơn mình.',
  },
  {
    id: 'phrase_excuse_me',
    categoryVi: 'Lễ phép',
    pronunciationTip: '/ɪkˈskjuːz miː/',
    english: 'Excuse me, please!',
    vietnamese: 'Xin lỗi cho con hỏi!',
    contextVi: 'Nói khi muốn xin phép đi qua hoặc nhờ ai chú ý.',
  },
  {
    id: 'phrase_i_love_you',
    categoryVi: 'Yêu thương',
    pronunciationTip: '/aɪ lʌv juː/',
    english: 'I love you, Mom and Dad!',
    vietnamese: 'Con yêu bố mẹ nhiều lắm!',
    contextVi: 'Bày tỏ tình cảm ấm áp với gia đình.',
  },
  {
    id: 'phrase_lets_play',
    categoryVi: 'Vui chơi',
    pronunciationTip: '/lets pleɪ/',
    english: "Let's play together!",
    vietnamese: 'Cùng chơi với nhau nhé!',
    contextVi: 'Mời bạn bè cùng tham gia trò chơi.',
  },
  {
    id: 'phrase_good_night',
    categoryVi: 'Chúc ngủ ngon',
    pronunciationTip: '/ɡʊd naɪt/',
    english: 'Good night, sweet dreams!',
    vietnamese: 'Chúc ngủ ngon, giấc mơ đẹp nhé!',
    contextVi: 'Chúc bố mẹ trước khi đi ngủ buổi tối.',
  },
];
