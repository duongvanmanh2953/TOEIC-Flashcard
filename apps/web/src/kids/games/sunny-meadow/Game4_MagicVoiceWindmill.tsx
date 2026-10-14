import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../../services/audio/MeadowAudioEngine';
import { meadowStore } from '../../core/meadowStateStore';

interface Game4Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface VoiceWord {
  word: string;
  phonetic: string;
  meaningVi: string;
  prompt: string;
}

const WORDS: VoiceWord[] = [
  {
    word: 'RAINBOW',
    phonetic: '/ˈreɪn.bəʊ/',
    meaningVi: 'Cầu Vồng Bảy Sắc',
    prompt: 'Say RAINBOW loudly to make the windmill spin!',
  },
  {
    word: 'SUNSHINE',
    phonetic: '/ˈsʌn.ʃaɪn/',
    meaningVi: 'Ánh Nắng Ban Mai',
    prompt: 'Say SUNSHINE to blow the dandelion seeds!',
  },
  {
    word: 'BUTTERFLY',
    phonetic: '/ˈbʌt.ə.flaɪ/',
    meaningVi: 'Chú Bướm Xinh Đẹp',
    prompt: 'Say BUTTERFLY to fly the hot air balloon!',
  },
  {
    word: 'MEADOW',
    phonetic: '/ˈmed.əʊ/',
    meaningVi: 'Đồng Cỏ Xanh Rờn',
    prompt: 'Say MEADOW to blow the magic wind!',
  },
];

export const Game4_MagicVoiceWindmill: React.FC<Game4Props> = ({ onExit, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [windLevel, setWindLevel] = useState(1); // 1 to 5
  const [balloonLift, setBalloonLift] = useState(0); // 0 to 100
  const [seedsFlying, setSeedsFlying] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const wordData = WORDS[currentIdx];

  useEffect(() => {
    setWindLevel(1);
    setBalloonLift(0);
    setSeedsFlying(false);

    const timer = setTimeout(() => {
      speakModelWord();
    }, 450);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  const speakModelWord = () => {
    MeadowAudioEngine.playWoodTap('C5');
    MeadowAudioEngine.speak(`Listen! ${wordData.word}! Now your turn: say ${wordData.word}!`);
  };

  const handleStartSpeaking = () => {
    if (isListening || showVictory) return;

    setIsListening(true);
    setWindLevel(3);
    MeadowAudioEngine.playBreeze();

    // Try browser SpeechRecognition if supported, else simulate physics wind
    const SpeechRec = (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).webkitSpeechRecognition ||
                      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;

    let recognized = false;

    if (SpeechRec) {
      try {
        const recognition = new (SpeechRec as any)();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = () => {
          recognized = true;
          boostWindPower();
        };

        recognition.onerror = () => {
          // If error/no mic, gracefully boost wind after 1.5s
          setTimeout(boostWindPower, 1500);
        };

        recognition.start();
      } catch {
        setTimeout(boostWindPower, 1800);
      }
    } else {
      setTimeout(boostWindPower, 1800);
    }
  };

  const boostWindPower = () => {
    setWindLevel(5);
    setSeedsFlying(true);
    setBalloonLift(80);
    MeadowAudioEngine.playBreeze();

    setTimeout(() => {
      MeadowAudioEngine.playMagicalSuccess();
      MeadowAudioEngine.speak(`Incredible! You said ${wordData.word} so wonderfully!`);
      meadowStore.addStars(10);
      meadowStore.unlockSticker('windmill');

      setTimeout(() => {
        setIsListening(false);
        if (currentIdx < WORDS.length - 1) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          setShowVictory(true);
          meadowStore.recordGameRound('voiceWindmill', 30);
          if (onComplete) onComplete();
        }
      }, 2500);
    }, 1200);
  };

  // Dynamic CSS spin speed based on wind power
  const spinSpeed = windLevel === 5 ? '0.4s' : windLevel === 3 ? '1s' : '3.5s';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none animate-fadeIn pb-8">
      {/* 1. Header Navigation Bar */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => {
            MeadowAudioEngine.playWoodTap('D4');
            onExit();
          }}
          className="toy-btn toy-btn-coral !min-h-[50px] !py-2 !px-4 text-base"
        >
          ← Trở Về Khu Rừng
        </button>

        <div className="px-4 py-2 rounded-2xl bg-rose-100 border-2 border-rose-300 font-display font-extrabold text-rose-900 text-sm flex items-center gap-1.5 shadow-sm">
          <svg className="w-5 h-5"><use href="#svg-star-badge"></use></svg>
          <span>Từ {currentIdx + 1} / {WORDS.length}</span>
        </div>
      </div>

      {/* 2. Main Stage Card */}
      <div className="meadow-clay-card w-full p-6 sm:p-8 bg-gradient-to-b from-[#D8F3FF] via-[#FFFDF5] to-[#FFD866]/30 relative overflow-hidden">
        {/* Audio Prompt Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/95 p-4 rounded-3xl border-2 border-white shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={speakModelWord}
              className="toy-btn toy-btn-coral w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              aria-label="Nghe Vẹt Echo phát âm mẫu"
              title="Nghe phát âm mẫu"
            >
              🦜
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full font-display">
                🌬️ Trò Chơi 4 • Cối Xay Gió & Khinh Khí Cầu Giọng Nói
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mt-1 font-display leading-tight">
                Say <span className="text-rose-600 underline">"{wordData.word}"</span>!
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500 font-body">
                ({wordData.phonetic} • {wordData.meaningVi})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-2xl shrink-0">
            <span className="text-xs uppercase font-extrabold text-amber-800 font-display">Sức Gió:</span>
            <span className="text-xl font-extrabold text-amber-600 font-display">
              {windLevel === 5 ? '🌪️ Bão Phép Thuật!' : windLevel === 3 ? '🍃 Gió Bay' : '🌤️ Êm Ả'}
            </span>
          </div>
        </div>

        {/* 3. Physical Windmill, Dandelion & Balloon Stage */}
        <div className="relative min-h-[280px] sm:min-h-[320px] flex items-end justify-between p-6 my-4 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200/80 border-2 border-sky-300">
          {/* Fluffy Dandelion Seeds in Wind */}
          {seedsFlying && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute left-10 top-20 text-3xl animate-bounce">✨</div>
              <div className="absolute left-1/3 top-10 text-2xl animate-ping">🌾</div>
              <div className="absolute left-2/3 top-16 text-3xl animate-bounce">🍃</div>
              <div className="absolute right-10 top-8 text-2xl animate-pulse">✨</div>
            </div>
          )}

          {/* Dandelion Flower */}
          <div className="w-24 h-32 relative shrink-0">
            <svg className="w-full h-full drop-shadow-sm">
              <use href="#svg-dandelion"></use>
            </svg>
          </div>

          {/* Wooden Windmill with spinning rotor */}
          <div className="w-40 h-48 sm:w-48 sm:h-56 relative flex items-center justify-center shrink-0">
            <svg className="w-full h-full drop-shadow-md">
              <use href="#svg-windmill"></use>
            </svg>
            {/* Spinning blades layer */}
            <div
              style={{
                animation: `wheel-spin ${spinSpeed} linear infinite`,
                transformOrigin: 'center center',
              }}
              className="absolute top-[22%] w-28 h-28 pointer-events-none flex items-center justify-center"
            >
              <div className="w-full h-2 bg-amber-400 rounded-full shadow-sm" />
              <div className="absolute w-2 h-full bg-sky-400 rounded-full shadow-sm" />
              <div className="absolute w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
            </div>
          </div>

          {/* Hot Air Balloon (Lifting up on voice command!) */}
          <div
            style={{
              transform: `translateY(-${balloonLift}px)`,
              transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className="w-28 h-36 relative shrink-0 drop-shadow-lg"
          >
            <svg className="w-full h-full">
              <use href="#svg-hot-air-balloon"></use>
            </svg>
            {/* Sunny waving from balloon */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-10">
              <svg className="w-full h-full">
                <use href="#svg-sunny-fox"></use>
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Giant Coral Microphone Push Button */}
        <div className="flex flex-col items-center justify-center pt-2">
          <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-rose-900 mb-3 font-display">
            👇 Bấm nút Micro và đọc to từ "{wordData.word}" để tạo gió thần kỳ:
          </p>

          <button
            type="button"
            onClick={handleStartSpeaking}
            disabled={isListening}
            className={`toy-btn toy-btn-coral min-w-[220px] min-h-[76px] !rounded-full text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
              isListening ? 'animate-pulse ring-8 ring-rose-300' : 'hover:scale-105'
            }`}
          >
            <span className="text-3xl">{isListening ? '🎙️ Gió Đang Thổi...' : '🎤 Nói To Từ Này!'}</span>
          </button>
        </div>
      </div>

      {/* 5. Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="meadow-clay-card max-w-md w-full p-8 text-center bg-[#FFFDF5] border-4 border-rose-400 shadow-2xl relative">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
              🎈 🌬️
            </div>
            <h3 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
              Giọng Nói Thần Kỳ Tuyệt Đỉnh!
            </h3>
            <p className="text-sm font-semibold text-[#475569] font-body mb-6">
              Khinh khí cầu của bạn Cáo đã bay qua đỉnh đồi xanh ngát! Bé nhận được <strong className="text-amber-600 font-extrabold">+30 Sao Vàng</strong>!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  MeadowAudioEngine.playWoodTap('C6');
                  setCurrentIdx(0);
                  setShowVictory(false);
                }}
                className="toy-btn toy-btn-green w-full"
              >
                🔁 Luyện Nói Lại
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

export default Game4_MagicVoiceWindmill;
