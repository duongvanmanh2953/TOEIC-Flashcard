/**
 * questionsData.ts
 * Standardized, fully bilingual (EN + VI) question dataset for Kids quizzes and games.
 * Every question is strictly verified with exactly 1 correct answer and full translations.
 */

export interface QuestionAnswer {
  id: string;
  text: string;
  textVi: string;
  correct: boolean;
}

export interface KidQuestion {
  id: string;
  question: string;
  questionVi: string;
  answers: QuestionAnswer[];
  correctAnswerId: string;
  explanationEn?: string;
  explanationVi?: string;
  category?: string;
  audioPrompt?: string;
}

export const KIDS_QUESTIONS_DATA: KidQuestion[] = [
  {
    id: 'q-apple-color',
    question: 'What color is the apple?',
    questionVi: 'Quả táo này có màu gì?',
    answers: [
      { id: 'a1', text: 'Red', textVi: 'Màu đỏ', correct: true },
      { id: 'a2', text: 'Blue', textVi: 'Màu xanh dương', correct: false },
      { id: 'a3', text: 'Green', textVi: 'Màu xanh lá', correct: false },
      { id: 'a4', text: 'Yellow', textVi: 'Màu vàng', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'Apples are sweet and bright red!',
    explanationVi: 'Quả táo chín mọng có màu đỏ tươi!',
    category: 'fruits',
    audioPrompt: 'What color is the apple?',
  },
  {
    id: 'q-cat-sound',
    question: 'What sound does a cat make?',
    questionVi: 'Con mèo kêu như thế nào?',
    answers: [
      { id: 'a1', text: 'Woof woof', textVi: 'Gâu gâu', correct: false },
      { id: 'a2', text: 'Meow meow', textVi: 'Meo meo', correct: true },
      { id: 'a3', text: 'Oink oink', textVi: 'Ủn ỉn', correct: false },
      { id: 'a4', text: 'Quack quack', textVi: 'Cạp cạp', correct: false },
    ],
    correctAnswerId: 'a2',
    explanationEn: 'Cats purr and say meow meow!',
    explanationVi: 'Mèo con kêu meo meo rất đáng yêu!',
    category: 'animals',
    audioPrompt: 'What sound does a cat make?',
  },
  {
    id: 'q-sun-sky',
    question: 'What shines bright in the sky during the day?',
    questionVi: 'Vật gì tỏa sáng rực rỡ trên bầu trời ban ngày?',
    answers: [
      { id: 'a1', text: 'The Moon', textVi: 'Mặt trăng', correct: false },
      { id: 'a2', text: 'The Sun', textVi: 'Mặt trời', correct: true },
      { id: 'a3', text: 'A Star', textVi: 'Ngôi sao', correct: false },
      { id: 'a4', text: 'A Cloud', textVi: 'Đám mây', correct: false },
    ],
    correctAnswerId: 'a2',
    explanationEn: 'The warm sun shines brightly in the daytime.',
    explanationVi: 'Mặt trời chiếu sáng rực rỡ vào ban ngày.',
    category: 'nature',
    audioPrompt: 'What shines bright in the sky during the day?',
  },
  {
    id: 'q-cat-eat',
    question: 'What does the cat love to eat?',
    questionVi: 'Chú mèo thích ăn món gì nhất?',
    answers: [
      { id: 'a1', text: 'Fish', textVi: 'Cá tươi', correct: true },
      { id: 'a2', text: 'Banana', textVi: 'Quả chuối', correct: false },
      { id: 'a3', text: 'Grass', textVi: 'Cỏ', correct: false },
      { id: 'a4', text: 'Carrot', textVi: 'Củ cà rốt', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'Cats love eating delicious fish!',
    explanationVi: 'Mèo con rất mê món cá tươi ngon!',
    category: 'animals',
    audioPrompt: 'What does the cat love to eat?',
  },
  {
    id: 'q-monkey-eat',
    question: 'What does the monkey like to eat?',
    questionVi: 'Chú khỉ thích ăn món quả nào?',
    answers: [
      { id: 'a1', text: 'Banana', textVi: 'Quả chuối', correct: true },
      { id: 'a2', text: 'Milk', textVi: 'Sữa tươi', correct: false },
      { id: 'a3', text: 'Fish', textVi: 'Cá', correct: false },
      { id: 'a4', text: 'Meat', textVi: 'Thịt', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'Monkeys love sweet yellow bananas!',
    explanationVi: 'Khỉ rất thích ăn những quả chuối vàng!',
    category: 'animals',
    audioPrompt: 'What does the monkey like to eat?',
  },
  {
    id: 'q-dog-sound',
    question: 'What sound does a dog make?',
    questionVi: 'Chú chó kêu như thế nào?',
    answers: [
      { id: 'a1', text: 'Woof woof', textVi: 'Gâu gâu', correct: true },
      { id: 'a2', text: 'Meow meow', textVi: 'Meo meo', correct: false },
      { id: 'a3', text: 'Moo moo', textVi: 'Ùm bò', correct: false },
      { id: 'a4', text: 'Chirp chirp', textVi: 'Chíp chíp', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'Dogs bark happily: Woof woof!',
    explanationVi: 'Chú chó sủa vang mừng rỡ: Gâu gâu!',
    category: 'animals',
    audioPrompt: 'What sound does a dog make?',
  },
  {
    id: 'q-count-eyes',
    question: 'How many eyes do you have?',
    questionVi: 'Bé có bao nhiêu mắt?',
    answers: [
      { id: 'a1', text: 'One eye', textVi: 'Một mắt', correct: false },
      { id: 'a2', text: 'Two eyes', textVi: 'Hai mắt', correct: true },
      { id: 'a3', text: 'Three eyes', textVi: 'Ba mắt', correct: false },
      { id: 'a4', text: 'Four eyes', textVi: 'Bốn mắt', correct: false },
    ],
    correctAnswerId: 'a2',
    explanationEn: 'We have two bright eyes to see the world.',
    explanationVi: 'Bé có hai mắt tinh anh để ngắm nhìn thế giới.',
    category: 'body',
    audioPrompt: 'How many eyes do you have?',
  },
  {
    id: 'q-say-morning',
    question: 'What should you say in the morning?',
    questionVi: 'Buổi sáng thức dậy, bé nên chào như thế nào?',
    answers: [
      { id: 'a1', text: 'Good night!', textVi: 'Chúc ngủ ngon!', correct: false },
      { id: 'a2', text: 'Good morning!', textVi: 'Chào buổi sáng!', correct: true },
      { id: 'a3', text: 'Goodbye!', textVi: 'Tạm biệt!', correct: false },
      { id: 'a4', text: 'Sorry!', textVi: 'Xin lỗi!', correct: false },
    ],
    correctAnswerId: 'a2',
    explanationEn: 'Say "Good morning!" to greet parents happily.',
    explanationVi: 'Nói "Good morning!" để chào bố mẹ buổi sáng.',
    category: 'greetings',
    audioPrompt: 'What should you say in the morning?',
  },
  {
    id: 'q-say-help',
    question: 'What do you say when someone gives you a gift?',
    questionVi: 'Khi được nhận quà, bé sẽ nói câu gì?',
    answers: [
      { id: 'a1', text: 'Thank you!', textVi: 'Cảm ơn!', correct: true },
      { id: 'a2', text: 'Sorry!', textVi: 'Xin lỗi!', correct: false },
      { id: 'a3', text: 'No!', textVi: 'Không!', correct: false },
      { id: 'a4', text: 'Goodbye!', textVi: 'Tạm biệt!', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'Always say "Thank you!" politely when receiving something.',
    explanationVi: 'Luôn nói "Cảm ơn!" lịch sự khi nhận được quà nhé!',
    category: 'polite_words',
    audioPrompt: 'What do you say when someone gives you a gift?',
  },
  {
    id: 'q-elephant-size',
    question: 'Is an elephant big or small?',
    questionVi: 'Con voi to lớn hay nhỏ bé?',
    answers: [
      { id: 'a1', text: 'Very big', textVi: 'Rất to lớn', correct: true },
      { id: 'a2', text: 'Very small', textVi: 'Rất nhỏ bé', correct: false },
      { id: 'a3', text: 'Tiny', textVi: 'Tí hon', correct: false },
      { id: 'a4', text: 'Short', textVi: 'Ngắn', correct: false },
    ],
    correctAnswerId: 'a1',
    explanationEn: 'An elephant is very big and strong!',
    explanationVi: 'Con voi rất to lớn và khỏe mạnh!',
    category: 'animals',
    audioPrompt: 'Is an elephant big or small?',
  },
];
