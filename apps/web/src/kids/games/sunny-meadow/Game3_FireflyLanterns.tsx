import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../../services/audio/MeadowAudioEngine';
import { meadowStore } from '../../core/meadowStateStore';

interface Game3Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface PhonicsWord {
  word: string;
  phonemes: string[];
  meaningVi: string;
  options: string[];
}

const WORDS: PhonicsWord[] = [
  {
    word: 'SUN',
    phonemes: ['/s/', '/ʌ/', '/n/'],
    meaningVi: 'Mặt Trời',
    options: ['S', 'U', 'N', 'B', 'T'],
  },
  {
    word: 'FOX',
    phonemes: ['/f/', '/ɒ/', '/ks/'],
    meaningVi: 'Bạn Cáo',
    options: ['F', 'O', 'X', 'M', 'P'],
  },
  {
    word: 'BEE',
    phonemes: ['/b/', '/iː/'],
    meaningVi: 'Chú Ong Chăm Chỉ',
    options: ['B', 'E', 'A', 'D', 'K'],
  },
  {
    word: 'CAT',
    phonemes: ['/k/', '/æ/', '/t/'],
    meaningVi: 'Mèo Con Đáng Yêu',
    options: ['C', 'A', 'T', 'H', 'R'],
  },
];

export const Game3_FireflyLanterns: React.FC<Game3Props> = ({ onExit, onComplete }) => {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [litLetters, setLitLetters] = useState<string[]>([]);
  const [owlSpeaking, setOwlSpeaking] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const wordData = WORDS[currentWordIdx];
  const targetLetters = wordData.word.split('');

  useEffect(() => {
    setLitLetters([]);
    const timer = setTimeout(() => {
      speakWordPhonics();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentWordIdx]);

  const speakWordPhonics = () => {
    setOwlSpeaking(true);
    MeadowAudioEngine.playFireflyChime();
    const spellOut = targetLetters.join(' ... ');
    MeadowAudioEngine.speak(
      `Catch the glowing fireflies for ${spellOut}! ${wordData.word}!`,
      {
        rate: 0.8,
        onEnd: () => setOwlSpeaking(false),
      }
    );
  };

  const handleCatchFirefly = (letter: string) => {
    const nextIdxNeeded = litLetters.length;
    const expectedLetter = targetLetters[nextIdxNeeded];

    if (letter === expectedLetter) {
      // Correct firefly!
      MeadowAudioEngine.playFireflyChime();
      MeadowAudioEngine.speak(letter, { rate: 0.85, pitch: 1.25 });
      const nextLit = [...litLetters, letter];
      setLitLetters(nextLit);

      if (nextLit.length === targetLetters.length) {
        // Full word illuminated!
        setTimeout(() => {
          MeadowAudioEngine.playMagicalSuccess();
          MeadowAudioEngine.speak(`Wonderful! ${wordData.word}! ${wordData.meaningVi}!`);
          meadowStore.addStars(10);
          meadowStore.unlockSticker('glow-firefly');
          meadowStore.unlockSticker('magic-lantern');

          setTimeout(() => {
            if (currentWordIdx < WORDS.length - 1) {
              setCurrentWordIdx((prev) => prev + 1);
            } else {
              setShowVictory(true);
              meadowStore.recordGameRound('fireflyLanterns', 30);
              if (onComplete) onComplete();
            }
          }, 2400);
        }, 400);
      }
    } else {
      // Gentle hint (Zero-punishment)
      MeadowAudioEngine.playSoftBounce();
      MeadowAudioEngine.speak(
        `Ooh, that is letter ${letter}! We are looking for ${expectedLetter}!`,
        { rate: 0.85 }
      );
    }
  };

  const isFullWordLit = litLetters.length === targetLetters.length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none animate-fadeIn pb-8">
      {/* 1. Header Navigation Bar */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => {
            MeadowAudioEngine.playWoodTap('D4');
            onExit();
          }}
          className="toy-btn toy-btn-purple !min-h-[50px] !py-2 !px-4 text-base"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="px-4 py-2 rounded-2xl bg-indigo-900/80 border-2 border-indigo-400 font-display font-extrabold text-amber-300 text-sm flex items-center gap-1.5 shadow-sm">
          <svg className="w-5 h-5"><use href="#svg-star-badge"></use></svg>
          <span>Từ {currentWordIdx + 1} / {WORDS.length}</span>
        </div>
      </div>

      {/* 2. Main Enchanted Twilight Night Stage */}
      <div
        className={`meadow-clay-card w-full p-6 sm:p-8 relative overflow-hidden transition-all duration-700 ${
          isFullWordLit
            ? 'bg-gradient-to-b from-[#312E81] via-[#4338CA] to-[#047857]'
            : 'bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#312E81]'
        }`}
      >
        {/* Audio Prompt Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border-2 border-indigo-400/50 shadow-sm text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={speakWordPhonics}
              className="toy-btn toy-btn-purple w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              aria-label="Nghe Cú Ollie phát âm"
              title="Nghe Cú Ollie đọc âm vị"
            >
              🦉
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full font-display">
                ✨ Trò Chơi 3 • Đom Đóm Thắp Sáng Đêm Rừng
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1 font-display leading-tight">
                "Catch the fireflies for <span className="text-amber-400 underline">{wordData.word}</span>!"
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-300 font-body">
                (Bé chạm vào các chú đom đóm mang chữ cái để thắp sáng lồng đèn nhé!)
              </p>
            </div>
          </div>

          {/* Meaning tag */}
          <div className="px-4 py-2 rounded-2xl bg-indigo-950/80 border border-indigo-300 text-amber-300 font-display font-extrabold text-base">
            {wordData.meaningVi}
          </div>
        </div>

        {/* 3. Lanterns Stage (Hanging in enchanted twilight) */}
        <div className="relative min-h-[220px] sm:min-h-[250px] flex items-center justify-center gap-6 sm:gap-10 my-4">
          {targetLetters.map((char, index) => {
            const isLit = litLetters.length > index;
            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center transition-all duration-500"
              >
                {/* Magic Lantern */}
                <div
                  style={{ color: isLit ? '#FFD166' : '#334155' }}
                  className={`w-24 h-28 sm:w-28 sm:h-32 transition-transform duration-500 relative flex items-center justify-center ${
                    isLit ? 'scale-110 drop-shadow-[0_0_24px_rgba(255,209,102,0.85)]' : 'opacity-40'
                  }`}
                >
                  <svg className="w-full h-full">
                    <use href="#svg-magic-lantern"></use>
                  </svg>
                  {/* Inside Letter Glowing */}
                  <span
                    className={`absolute inset-0 flex items-center justify-center font-display font-extrabold text-3xl sm:text-4xl pt-4 ${
                      isLit ? 'text-amber-900 drop-shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {isLit ? char : '?'}
                  </span>
                </div>

                <div
                  className={`mt-2 font-display font-extrabold text-sm sm:text-base ${
                    isLit ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  Âm {index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Flying Fireflies Tray (Interactive touch buttons) */}
        <div className="bg-indigo-950/70 border-4 border-indigo-400/60 rounded-3xl p-5 relative">
          <p className="text-center text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-300 mb-4 font-display">
            ✨ Chạm vào chú đom đóm mang chữ cái đúng thứ tự để đưa vào lồng đèn:
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
            {wordData.options.map((letter, idx) => (
              <button
                key={`${letter}-${idx}`}
                type="button"
                onClick={() => handleCatchFirefly(letter)}
                className="meadow-clay-card p-3 flex flex-col items-center justify-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer min-h-[120px] bg-[#1E1B4B] border-2 border-amber-300/60 hover:border-amber-300 shadow-lg group relative overflow-hidden"
              >
                {/* Glow backdrop */}
                <div className="absolute inset-0 bg-amber-400/10 rounded-2xl group-hover:bg-amber-400/20 transition-colors pointer-events-none" />

                {/* Firefly SVG */}
                <div className="w-14 h-14 flex items-center justify-center animate-bounce-subtle">
                  <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(255,209,102,0.6)]">
                    <use href="#svg-glow-firefly"></use>
                  </svg>
                </div>

                {/* Letter Token */}
                <span className="font-display font-extrabold text-amber-300 text-2xl group-hover:scale-110 transition-transform">
                  {letter}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="meadow-clay-card max-w-md w-full p-8 text-center bg-[#FFFDF5] border-4 border-amber-400 shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              ✨ 🏮
            </div>
            <h3 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
              Khu Rừng Đêm Tỏa Sáng!
            </h3>
            <p className="text-sm font-semibold text-[#475569] font-body mb-6">
              Bé đã giải đố xuất sắc toàn bộ chữ cái đom đóm và nhận được <strong className="text-amber-600 font-extrabold">+30 Sao Vàng</strong>!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('C6');
                  setCurrentWordIdx(0);
                  setShowVictory(false);
                }}
                className="toy-btn toy-btn-green w-full"
              >
                🔁 Thắp Sáng Lại Đêm Rừng
              </button>
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('D4');
                  onExit();
                }}
                className="toy-btn toy-btn-amber w-full"
              >
                🏡 Về Bản Đồ Đồng Cỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game3_FireflyLanterns;
