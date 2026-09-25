import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import { RichAIMessageRenderer } from '../components/ai/RichAIMessageRenderer';
import { confirmModal } from '../components/common/ConfirmDialog';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  BrainCircuit,
  MessageSquare,
  Shield,
  HelpCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Cpu,
  Smile,
  Briefcase,
  GraduationCap,
  Globe,
  Radio,
  FileText,
  Copy,
  Check,
  PhoneCall,
  PhoneOff,
  Headphones,
  Waves,
  Zap,
  Plus,
  X,
  Settings2,
  Trash2,
  Send,
  Clock,
} from 'lucide-react';
import { ModalPortal } from '../components/common/ModalPortal';
import { audioEngine } from '../lib/audioEngine';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { evaluatePronunciation } from '../lib/pronunciationEvaluator';
import { useLearningContext } from '../contexts/LearningContext';
import { getLanguage, SUPPORTED_LANGUAGES, getSpeechLocale } from '../config/languages';
import { CountryFlag } from '../components/language/CountryFlag';

const LANGUAGE_PRACTICE_WORDS: Record<string, Array<{ word: string; ipa: string; phoneme: string; meaning: string }>> = {
  en: [
    { word: 'thoroughly', ipa: '/ˈθɜːrəli/', phoneme: '/θ/', meaning: 'Kỹ lưỡng, thấu đáo' },
    { word: 'schedule', ipa: '/ˈskedʒuːl/', phoneme: '/sk/', meaning: 'Lịch trình, kế hoạch' },
    { word: 'vulnerable', ipa: '/ˈvʌlnərəbl/', phoneme: '/v/', meaning: 'Dễ bị tổn thương' },
    { word: 'architecture', ipa: '/ˈɑːrkɪtektʃər/', phoneme: '/tʃ/', meaning: 'Kiến trúc hệ thống' },
    { word: 'regularly', ipa: '/ˈreɡjələrli/', phoneme: '/r/ & /l/', meaning: 'Thường xuyên' },
  ],
  de: [
    { word: 'Zuverlässigkeit', ipa: '/ˈtsuːfɛɐ̯ˌlɛsɪçkaɪt/', phoneme: '/ç/ & /z/', meaning: 'Sự đáng tin cậy' },
    { word: 'Entwicklung', ipa: '/ɛntˈvɪklʊŋ/', phoneme: '/pf/ & /ŋ/', meaning: 'Sự phát triển' },
    { word: 'Geschwindigkeit', ipa: '/ɡəˈʃvɪndɪçkaɪt/', phoneme: '/ʃv/', meaning: 'Tốc độ, nhanh nhẹn' },
    { word: 'Wunderbar', ipa: '/ˈvʊndɐbaːɐ̯/', phoneme: '/v/ & /r/', meaning: 'Tuyệt vời, kỳ diệu' },
    { word: 'Verständnis', ipa: '/fɛɐ̯ˈʃtɛntnɪs/', phoneme: '/f/ & /ʃt/', meaning: 'Sự thấu hiểu' },
  ],
  ja: [
    { word: '改善', ipa: '/kaizen/', phoneme: 'かいぜん', meaning: 'Cải tiến liên tục' },
    { word: 'ありがとうございます', ipa: '/aɾiɡatoː gozaimasɯ/', phoneme: '有難う', meaning: 'Cảm ơn chân thành' },
    { word: '一生懸命', ipa: '/iɕːoːkeːmeː/', phoneme: 'いっしょうけんめい', meaning: 'Hết sức cố gắng' },
    { word: '素晴らしい', ipa: '/sɯbaɾaɕiː/', phoneme: 'すばらしい', meaning: 'Tuyệt vời' },
    { word: '効率的', ipa: '/koːɾitsɯteki/', phoneme: 'こうりつてき', meaning: 'Mang tính hiệu quả' },
  ],
  zh: [
    { word: '坚持不懈', ipa: '/tɕjɛn˥ ʈʂʰʐ̩˧˥ pu˥˩ ɕjɛ˥˩/', phoneme: 'jiān chí bù xiè', meaning: 'Kiên trì không ngừng nghỉ' },
    { word: '脚踏实地', ipa: '/tɕjaʊ˨˩˦ tʰa˥˩ ʂʐ̩˧˥ ti˥˩/', phoneme: 'jiǎo tà shí dì', meaning: 'Thiết thực, vững vàng' },
    { word: '齐心协力', ipa: '/tɕʰi˧˥ ɕin˥ ɕjɛ˧˥ li˥˩/', phoneme: 'qí xīn xié lì', meaning: 'Đồng tâm hiệp lực' },
    { word: '独具匠心', ipa: '/tu˧˥ tɕy˥˩ tɕjaŋ˥˩ ɕin˥/', phoneme: 'dú jù jiàng xīn', meaning: 'Sáng tạo độc đáo' },
    { word: '蒸蒸日上', ipa: '/ʈʂɤŋ˥ ʈʂɤŋ˥ ʐʐ̩˥˩ ʂaŋ˥˩/', phoneme: 'zhēng zhēng rì shàng', meaning: 'Phát triển ngày một đi lên' },
  ],
  fr: [
    { word: 'Épanouissement', ipa: '/e.pa.nwi.smɑ̃/', phoneme: '/ɑ̃/', meaning: 'Sự nở rộ, thăng hoa' },
    { word: 'Inoubliable', ipa: '/i.nu.bli.jabl/', phoneme: '/bl/', meaning: 'Không thể nào quên' },
    { word: 'Bienveillance', ipa: '/bjɛ̃.vɛ.jɑ̃s/', phoneme: '/bjɛ̃/', meaning: 'Lòng nhân từ, thiện chí' },
    { word: 'Développement', ipa: '/de.vlɔp.mɑ̃/', phoneme: '/mɑ̃/', meaning: 'Sự phát triển bền vững' },
    { word: 'Magnifique', ipa: '/ma.ɲi.fik/', phoneme: '/ɲ/', meaning: 'Tráng lệ, tuyệt đẹp' },
  ],
  es: [
    { word: 'Desarrollo', ipa: '/desaˈroʎo/', phoneme: '/rr/ & /ll/', meaning: 'Sự phát triển' },
    { word: 'Inquebrantable', ipa: '/iŋkeβɾanˈtaβle/', phoneme: '/β/ & /ɾ/', meaning: 'Kiên định, không thể lung lay' },
    { word: 'Agradecimiento', ipa: '/aɣɾaðeθiˈmjento/', phoneme: '/θ/ & /ð/', meaning: 'Lòng biết ơn sâu sắc' },
    { word: 'Maravilloso', ipa: '/maɾaβiˈʎoso/', phoneme: '/ʎ/', meaning: 'Kỳ diệu, tuyệt vời' },
    { word: 'Responsabilidad', ipa: '/responsaβiliˈðað/', phoneme: '/ðað/', meaning: 'Tinh thần trách nhiệm' },
  ],
  ko: [
    { word: '성장', ipa: '/sʰʌ̹ŋdʑa̠ŋ/', phoneme: 'Seongjang', meaning: 'Sự trưởng thành, phát triển' },
    { word: '감사합니다', ipa: '/kam.sa.ham.ni.da/', phoneme: 'Gamsahamnida', meaning: 'Cảm ơn chân thành' },
    { word: '열심히', ipa: '/jʌ̹l.s͈im.hi/', phoneme: 'Yeolsimhi', meaning: 'Chăm chỉ, hết mình' },
    { word: '아름답다', ipa: '/a.ɾɯm.dap̚.t͈a/', phoneme: 'Areumdapda', meaning: 'Đẹp đẽ, tuyệt diệu' },
    { word: '도전하다', ipa: '/to.dʑʌn.ha.da/', phoneme: 'Dojeonhada', meaning: 'Thử thách, chinh phục' },
  ],
};

export const AI_LANGUAGE_GREETINGS: Record<
  string,
  {
    content: string;
    viTranslation: string;
    simulatorOpening: (scName: string) => string;
  }
> = {
  de: {
    content: "Hallo! Ich bin dein persönlicher KI-Coach für Deutsch. Woran möchtest du heute arbeiten? Sprich gerne auf Deutsch, oder wechsle zu Vietnamesisch, wenn du Hilfe brauchst.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Đức của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Đức, hoặc chuyển sang tiếng Việt khi cần nhé.",
    simulatorOpening: (sc) => `Hallo! Willkommen zum Training für ${sc}. Was ist Ihr Vorschlag?`,
  },
  ja: {
    content: "こんにちは！あなたのAI専属日本語コーチです。今日はどんな練習をしましょうか？気軽に日本語で話しかけてくださいね。困ったらベトナム語でも大丈夫ですよ！",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Nhật của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Nhật, hoặc dùng tiếng Việt khi cần nhé!",
    simulatorOpening: (sc) => `こんにちは！${sc}のシミュレーションを始めましょう。あなたの提案をお聞かせください。`,
  },
  zh: {
    content: "你好！我是你的AI专属中文教练。今天你想练习什么主题？请随时用中文和我交流，遇到困难也可以切换成越南语哦！",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Trung của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Trung, hoặc chuyển sang tiếng Việt nhé!",
    simulatorOpening: (sc) => `你好！让我们开始${sc}的场景模拟。请问你的方案是什么？`,
  },
  fr: {
    content: "Bonjour ! Je suis votre coach personnel IA pour le français. Sur quel sujet souhaitez-vous vous entraîner aujourd'hui ? N'hésitez pas à parler en français, ou à passer au vietnamien si besoin.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Pháp của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Pháp, hoặc chuyển sang tiếng Việt khi cần nhé.",
    simulatorOpening: (sc) => `Bonjour ! Commençons la simulation pour ${sc}. Quelle est votre proposition ?`,
  },
  es: {
    content: "¡Hola! Soy tu entrenador personal de IA para español. ¿Sobre qué tema te gustaría practicar hoy? Siéntete libre de hablar en español, o cambia a vietnamita si lo necesitas.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Tây Ban Nha của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Tây Ban Nha, hoặc chuyển sang tiếng Việt nhé.",
    simulatorOpening: (sc) => `¡Hola! Comencemos la simulación para ${sc}. ¿Cuál es tu propuesta?`,
  },
  ko: {
    content: "안녕하세요! 저는 당신의 AI 전담 한국어 코치입니다. 오늘 어떤 주제로 연습하고 싶으신가요? 편하게 한국어로 대화해 보세요. 막히면 베트남어로 말씀하셔도 괜찮아요!",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Hàn của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Hàn, hoặc chuyển sang tiếng Việt khi cần nhé!",
    simulatorOpening: (sc) => `안녕하세요! ${sc} 시뮬레이션을 시작하겠습니다. 어떤 제안이 있으신가요?`,
  },
  en: {
    content: "Hello! I'm your AI Personal English Coach. What would you like to practice today? Feel free to speak in English, or switch to Vietnamese whenever you feel stuck.",
    viTranslation: "Xin chào! Tôi là Huấn luyện viên AI Tiếng Anh của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Cứ thoải mái nói tiếng Anh, hoặc chuyển sang tiếng Việt khi bí nhé.",
    simulatorOpening: (sc) => `Hello, let's start the simulation for ${sc}. What is your proposal?`,
  },
};

export const getAILanguageGreeting = (langId: string) => {
  return AI_LANGUAGE_GREETINGS[langId] || AI_LANGUAGE_GREETINGS.en;
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  viTranslation?: string;
  audioUrl?: string;
  timestamp: Date;
}

export const AICoachStudioPage: React.FC = () => {
  const { user, isGuest, promptLogin } = useAuth();

  let learningCtx: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    learningCtx = useLearningContext();
  } catch (_) { }

  const activeLanguage = learningCtx?.activeLanguage || getLanguage('en');
  const targetLocale = activeLanguage.speechLocale || 'en-US';

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<'voice' | 'pronunciation' | 'simulator' | 'error-bank' | 'sound-better'>('voice');

  // Hero banner dismiss state
  const [showHeroBanner, setShowHeroBanner] = useState(() => {
    return localStorage.getItem('leximind_hide_coach_hero') !== 'true';
  });

  const dismissHeroBanner = () => {
    setShowHeroBanner(false);
    localStorage.setItem('leximind_hide_coach_hero', 'true');
  };

  // ==========================================
  // TAB 1: REAL-TIME VOICE COACH & HANDS-FREE 1:1 CALL
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const greeting = getAILanguageGreeting(activeLanguage.id);
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: greeting.content,
        viTranslation: greeting.viTranslation,
        timestamp: new Date(),
      },
    ];
  });

  // Dynamically update welcome message when active language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1 && (prev.length === 0 || prev[0]?.id?.startsWith('welcome'))) {
        const greeting = getAILanguageGreeting(activeLanguage.id);
        return [
          {
            id: 'welcome-' + activeLanguage.id,
            role: 'assistant',
            content: greeting.content,
            viTranslation: greeting.viTranslation,
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [activeLanguage.id]);

  const [coachPersonality, setCoachPersonality] = useState('Friendly Tutor');
  const [bilingualMode, setBilingualMode] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [fearlessLevel, setFearlessLevel] = useState<number>(2);
  const [whatShouldISayStep, setWhatShouldISayStep] = useState<number | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // User Voice & Speech Input Language Preference (Syncs with active learning language setting)
  const [voiceLang, setVoiceLang] = useState<'vi' | 'en' | 'auto'>(() => {
    return audioEngine.getPreferredVoiceLang();
  });
  const [speechInputLang, setSpeechInputLang] = useState<string>(() => {
    return activeLanguage.speechLocale || 'en-US';
  });
  const [chatLanguageMode, setChatLanguageMode] = useState<'bilingual' | 'vi' | 'en'>('bilingual');

  // Synchronize target audio & mic recognition when user changes language
  useEffect(() => {
    if (activeLanguage?.speechLocale) {
      audioEngine.setPreferredTargetLocale(activeLanguage.speechLocale);
      setSpeechInputLang(activeLanguage.speechLocale);
    }
  }, [activeLanguage?.speechLocale]);

  useEffect(() => {
    if (recognitionRef.current && speechInputLang) {
      try {
        recognitionRef.current.lang = speechInputLang;
      } catch (_) { }
    }
  }, [speechInputLang]);

  interface ChatSuggestion {
    id: string;
    title: string;
    category: string;
    hasCache: boolean;
  }
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
    return audioEngine.getPreferredVoiceGender();
  });

  const handleVoiceGenderChange = (gender: 'male' | 'female') => {
    setVoiceGender(gender);
    audioEngine.setPreferredVoiceGender(gender);
  };

  const handleVoiceLangChange = (mode: 'vi' | 'en' | 'auto') => {
    setVoiceLang(mode);
    audioEngine.setPreferredVoiceLang(mode);
  };

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const isCallActiveRef = useRef(isCallActive);
  isCallActiveRef.current = isCallActive;

  const currentTranscriptRef = useRef('');
  currentTranscriptRef.current = transcript;

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechInputLang;

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // In 1:1 call mode: auto detect end-of-speech silence (1.4s)
        if (isCallActiveRef.current && currentText.trim().length > 1) {
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          setCallStatus('listening');
          silenceTimeoutRef.current = setTimeout(() => {
            const finalSpeech = currentText.trim();
            if (finalSpeech && isCallActiveRef.current) {
              try {
                recognition.stop();
              } catch (_) { }
              handleSendMessage(finalSpeech);
            }
          }, 1400);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If still in active call mode and not currently thinking/speaking, restart recognition
        if (isCallActiveRef.current && callStatus !== 'speaking' && callStatus !== 'thinking') {
          setTimeout(() => {
            if (isCallActiveRef.current) {
              try {
                recognition.start();
                setIsListening(true);
                setCallStatus('listening');
              } catch (_) { }
            }
          }, 300);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) { }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callStatus, speechInputLang]);

  // Fetch smart autocomplete and cached suggestions from DB (saves API tokens)
  useEffect(() => {
    let isCancelled = false;
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/ai/suggestions?q=${encodeURIComponent(transcript.trim())}`);
        const list = res.data?.data || res.data || [];
        if (!isCancelled && Array.isArray(list)) {
          setSuggestions(list);
        }
      } catch (_) { }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [transcript]);

  const [isHoldingToRecord, setIsHoldingToRecord] = useState(false);
  const holdStartTimeRef = useRef(0);

  const startListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    setTranscript('');
    currentTranscriptRef.current = '';
    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = speechInputLang;
      }
      recognitionRef.current?.start();
      setIsListening(true);
      if (isCallActiveRef.current) setCallStatus('listening');
    } catch (err) {
      console.warn('Speech recognition start error:', err);
    }
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (_) { }
    setIsListening(false);
    setIsHoldingToRecord(false);
  };

  const handleHoldStart = (e?: React.SyntheticEvent) => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    if (isCallActive) return; // In 1:1 call mode, hands-free takes care of it

    holdStartTimeRef.current = Date.now();
    setIsHoldingToRecord(true);
    startListening();
  };

  const handleHoldEnd = () => {
    if (!isHoldingToRecord || isCallActive) return;
    setIsHoldingToRecord(false);

    // Give a 200ms grace period to let SpeechRecognition append the final words
    setTimeout(() => {
      stopListening();
      const recorded = (currentTranscriptRef.current || transcript).trim();
      if (recorded.length > 0) {
        handleSendMessage(recorded);
      }
    }, 200);
  };

  const toggleListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    if (isListening) {
      stopListening();
      const recorded = (currentTranscriptRef.current || transcript).trim();
      if (recorded.length > 0) {
        handleSendMessage(recorded);
      }
    } else {
      startListening();
    }
  };

  // Toggle 1:1 Hands-Free Call Mode
  const toggleCallMode = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để gọi thoại 1:1 trực tiếp với AI Coach');
      return;
    }
    if (isCallActive) {
      // End call
      setIsCallActive(false);
      setCallStatus('idle');
      stopListening();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Start call
      setIsCallActive(true);
      setCallStatus('listening');
      startListening();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || transcript).trim();
    if (!msg) return;

    if (isGuest || !user) {
      promptLogin('Đăng nhập để trò chuyện và nhận phân tích sửa lỗi từ AI Coach');
      return;
    }

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    setShowSuggestions(false);
    setCoachLoading(true);
    if (isCallActiveRef.current) setCallStatus('thinking');
    setWhatShouldISayStep(null);

    try {
      const res = await api.post('/ai/tutor', {
        message: msg,
        contextWord: coachPersonality,
        language: activeLanguage.id,
      });

      const data = res.data?.data || res.data || res;
      const assistantReply = data?.reply || data?.content || data?.text || `That's an insightful point! How would you describe the next milestone?`;

      const botMsg: ChatMessage & { provider?: string } = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: assistantReply,
        provider: data?.provider,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(assistantReply);
    } catch (err) {
      const fallbackReply = `I heard you clearly! Let's continue practicing ${activeLanguage.name}. What would you like to explore next?`;
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date(),
        },
      ]);
      speakText(fallbackReply);
    } finally {
      setCoachLoading(false);
    }
  };

  const speakText = (text: string, rate = 1.1) => {
    if (isCallActiveRef.current) {
      setCallStatus('speaking');
      try {
        recognitionRef.current?.stop();
      } catch (_) { }
    }

    audioEngine.playBilingualText(text, {
      rate,
      targetLocale: activeLanguage.speechLocale,
      onEnd: () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          setTimeout(() => {
            if (isCallActiveRef.current) {
              startListening();
            }
          }, 300);
        }
      },
      onError: () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          startListening();
        }
      },
    });
  };

  // ==========================================
  // TAB 2: PRONUNCIATION LAB & SHADOWING
  // ==========================================
  const [selectedWord, setSelectedWord] = useState('thoroughly');
  const [pronunciationResult, setPronunciationResult] = useState<any>(null);
  const [evaluatingPronunciation, setEvaluatingPronunciation] = useState(false);
  const [isRecordingPronunciation, setIsRecordingPronunciation] = useState(false);
  const [recordedSpokenWord, setRecordedSpokenWord] = useState('');
  const [customWordInput, setCustomWordInput] = useState('');
  const [customIpaInput, setCustomIpaInput] = useState('');
  const [customMeaningInput, setCustomMeaningInput] = useState('');
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const pronunciationRecRef = useRef<any>(null);
  const recordedSpokenWordRef = useRef<string>('');

  const [practiceWords, setPracticeWords] = useState<Array<{ word: string; ipa: string; phoneme: string; meaning: string; isCustom?: boolean }>>(() => {
    return LANGUAGE_PRACTICE_WORDS[activeLanguage.id] || LANGUAGE_PRACTICE_WORDS['en'];
  });

  // Automatically update practice words when active learning language changes
  useEffect(() => {
    const list = LANGUAGE_PRACTICE_WORDS[activeLanguage.id] || LANGUAGE_PRACTICE_WORDS['en'];
    setPracticeWords(list);
    if (list[0]) {
      setSelectedWord(list[0].word);
    }
  }, [activeLanguage.id]);

  const speakWord = (word: string, rate: number = 1.0) => {
    audioEngine.playWord(word, {
      rate,
      lang: activeLanguage.speechLocale,
    });
  };

  // Load words from user's flashcards/vault
  const handleLoadUserFlashcards = async () => {
    setLoadingFlashcards(true);
    try {
      const res = await api.get('/flashcards?limit=10');
      const cards = res.data?.data || res.data || [];
      if (Array.isArray(cards) && cards.length > 0) {
        const mapped = cards.slice(0, 8).map((c: any) => ({
          word: c.word || c.term,
          ipa: c.phonetic || c.ipa || `/${c.word}/`,
          phoneme: c.word?.slice(0, 2) || '/en/',
          meaning: c.definition || c.meaning || 'Từ vựng trong thẻ của bạn',
          isCustom: true,
        }));
        setPracticeWords((prev) => {
          const existing = new Set(prev.map((w) => w.word.toLowerCase()));
          const newOnes = mapped.filter((m: any) => !existing.has(m.word.toLowerCase()));
          return [...newOnes, ...prev];
        });
      }
    } catch {
      // Fallback sample cards
      setPracticeWords((prev) => [
        { word: 'collaborate', ipa: '/kəˈlæbəreɪt/', phoneme: '/b/ & /l/', meaning: 'Hợp tác (Thẻ của bạn)', isCustom: true },
        { word: 'negotiate', ipa: '/nɪˈɡoʊʃieɪt/', phoneme: '/ʃ/', meaning: 'Đàm phán (Thẻ của bạn)', isCustom: true },
        ...prev,
      ]);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleAddCustomWord = () => {
    if (!customWordInput.trim()) return;
    const newWord = customWordInput.trim().toLowerCase();
    const newEntry = {
      word: newWord,
      ipa: customIpaInput.trim() || `/${newWord}/`,
      phoneme: `/${newWord.slice(0, 2)}/`,
      meaning: customMeaningInput.trim() || 'Từ vựng tự thêm',
      isCustom: true,
    };
    setPracticeWords((prev) => [newEntry, ...prev]);
    setSelectedWord(newWord);
    setCustomWordInput('');
    setCustomIpaInput('');
    setCustomMeaningInput('');
    setShowAddWordModal(false);
  };

  // Phoneme detail dictionary
  const phonemeDetails: Record<string, any> = {
    thoroughly: {
      targetPhoneme: '/θ/',
      tonguePositionGuide: 'Đặt đầu lưỡi kẹp nhẹ giữa hai hàng răng cửa, đẩy luồng hơi liên tục qua kẽ răng mà không rung dây thanh quản.',
      techniqueTips: 'Không rụt lưỡi vào trong vòm miệng kẻo phát âm nhầm thành âm /t/ hoặc /s/. Giữ luồng hơi thoát đều.',
      pitfallAlert: 'Lỗi người Việt thường gặp: Đọc thành "thờ-rô-li" hoặc "tờ-rô-li". Hãy phát âm âm /θ/ vô thanh nhẹ nhàng.',
    },
    schedule: {
      targetPhoneme: '/sk/',
      tonguePositionGuide: 'Bắt đầu từ âm /s/ xì hơi ở đầu lưỡi gần vòm họng, sau đó bật dứt khoát âm /k/ từ cuống họng.',
      techniqueTips: 'Nối liền mạch /sk/, không chèn nguyên âm đệm như "xì-két-điu".',
      pitfallAlert: 'Lưu ý phiên âm Mỹ /ˈskedʒuːl/ khác với phiên âm Anh /ˈʃedjuːl/. Cả hai đều chuẩn nhưng nên đồng nhất.',
    },
    vulnerable: {
      targetPhoneme: '/v/',
      tonguePositionGuide: 'Răng cửa trên chạm nhẹ vào lòng môi dưới, đẩy hơi có rung dây thanh quản (âm hữu thanh).',
      techniqueTips: 'Phát âm rõ 4 âm tiết: /ˈvʌl.nər.ə.bl̩/ với trọng âm rơi vào âm tiết đầu tiên.',
      pitfallAlert: 'Tránh nuốt âm "ner" hoặc đọc lẫn lộn /v/ thành /w/ (quân-nơ-rơ-bồ).',
    },
    architecture: {
      targetPhoneme: '/tʃ/',
      tonguePositionGuide: 'Đưa đầu lưỡi lên vòm họng cứng sau chân răng, chặn hơi rồi bật dứt khoát như âm "ch" mạnh hơn.',
      techniqueTips: 'Âm "ch" trong "archi" lại phát âm là /k/ (/ˈɑːrkɪ-/), trong khi đuôi "ture" mới là /tʃər/.',
      pitfallAlert: 'Rất nhiều học viên đọc nhầm "art-chi-tek-tu-re". Cần chú ý /tʃər/ ở âm cuối.',
    },
    regularly: {
      targetPhoneme: '/r/ & /l/',
      tonguePositionGuide: 'Uốn cong lưỡi về phía sau cho âm /r/, sau đó đưa đầu lưỡi chạm vào chân răng trên cho âm /l/.',
      techniqueTips: 'Luyện chuyển vị trí lưỡi nhịp nhàng giữa /r/ và /l/: reg - yuh - ler - lee.',
      pitfallAlert: 'Hiện tượng lẹo lưỡi: người học hay bị nuốt bớt âm tiết hoặc nói thành "regu-lali".',
    },
  };

  // Tab 2 Voice Recorder Integration (cross-platform MediaRecorder + PCM WAV fallback)
  const {
    status: pronRecStatus,
    isRecording: isPronRecording,
    recordedUrl: pronRecordedUrl,
    isPlayingRecording: isPlayingPronRecording,
    recordingSeconds: pronRecordingSeconds,
    errorMessage: pronRecErrorMessage,
    startRecording: startPronVoiceRecording,
    stopRecording: stopPronVoiceRecording,
    replayRecording: replayPronVoiceRecording,
    stopReplay: stopPronVoiceReplay,
    resetRecording: resetPronVoiceRecording,
  } = useVoiceRecorder();

  const handleStartPronRecording = async () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện và chấm điểm phát âm chuẩn bản xứ');
      return;
    }
    setRecordedSpokenWord('');
    recordedSpokenWordRef.current = '';
    setPronunciationResult(null);

    // 1. Start cross-platform microphone recording (MediaRecorder / PCM)
    await startPronVoiceRecording();

    // 2. Start Web SpeechRecognition matching active language locale
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = activeLanguage.speechLocale || 'en-US';
        recognition.onresult = (event: any) => {
          const spoken = (event.results?.[0]?.[0]?.transcript || '').trim();
          recordedSpokenWordRef.current = spoken;
          setRecordedSpokenWord(spoken);
        };
        recognition.onerror = () => {
          // Keep whatever we have or empty
        };
        pronunciationRecRef.current = recognition;
        recognition.start();
      } catch (_) { }
    }
  };

  const handleStopPronRecording = async () => {
    try {
      pronunciationRecRef.current?.stop();
    } catch (_) { }

    await stopPronVoiceRecording();

    // Give SpeechRecognition a moment to flush final transcript
    setTimeout(() => {
      const spoken = recordedSpokenWordRef.current || recordedSpokenWord || '';
      evaluatePronunciationMatch(selectedWord, spoken);
    }, 200);
  };

  const handleToggleReplayPronRecording = () => {
    if (isPlayingPronRecording) {
      stopPronVoiceReplay();
    } else {
      replayPronVoiceRecording();
    }
  };

  const evaluatePronunciationMatch = async (target: string, spoken: string) => {
    setEvaluatingPronunciation(true);
    try {
      const res = await api.post('/ai/pronunciation', {
        word: target,
        spokenText: spoken,
        mode: 'adult',
        language: activeLanguage.id,
      });
      const data = res.data?.data || res.data;
      if (data && data.accuracy !== undefined) {
        setPronunciationResult(data);
        setEvaluatingPronunciation(false);
        return;
      }
    } catch (_) { }

    // Accurate local scoring engine (Levenshtein + Dice + Token Jaccard) with Adult threshold > 90%
    const evalResult = evaluatePronunciation(target, spoken, 'adult', activeLanguage.id);
    const score = evalResult.score;
    const isPassing = evalResult.isPassing; // Adult requires > 90%
    const details = phonemeDetails[target] || phonemeDetails['thoroughly'];

    setPronunciationResult({
      targetWord: target,
      spokenText: spoken,
      accuracy: score,
      isPassing,
      feedback: evalResult.feedback,
      phonemeAnalysis: {
        targetPhoneme: details?.targetPhoneme || '/th/',
        accuracyScore: score,
        tonguePositionGuide: details?.tonguePositionGuide || 'Đặt đầu lưỡi gần vòm họng và giữ luồng hơi ổn định.',
        techniqueTips: details?.techniqueTips || 'Luyện tập phát âm rõ từng âm tiết, đặc biệt chú ý âm cuối (ending sound).',
        pitfallAlert: details?.pitfallAlert || 'Người học hay nuốt âm cuối hoặc đặt sai trọng âm của từ.',
      },
      prosody: {
        stressAccuracy: isPassing ? Math.min(100, score + 2) : Math.max(35, Math.round(score * 0.9)),
        rhythmScore: isPassing ? Math.min(100, score) : Math.max(40, Math.round(score * 0.85)),
        intonationScore: isPassing ? Math.min(100, score + 1) : Math.max(38, Math.round(score * 0.88)),
      },
    });
    setEvaluatingPronunciation(false);
  };

  // ==========================================
  // TAB 3: REAL-WORLD SIMULATOR (ROLEPLAY)
  // ==========================================
  const [simulatorScenario, setSimulatorScenario] = useState('bug_delay_meeting');
  const [simulatorHistory, setSimulatorHistory] = useState<any[]>(() => {
    const greeting = getAILanguageGreeting(activeLanguage.id);
    return [
      {
        role: 'assistant',
        content: greeting.simulatorOpening('Giải Trình Hoãn Release'),
      },
    ];
  });

  // Dynamically update simulator greeting when active language changes
  useEffect(() => {
    setSimulatorHistory((prev) => {
      if (prev.length <= 1) {
        const greeting = getAILanguageGreeting(activeLanguage.id);
        return [
          {
            role: 'assistant',
            content: greeting.simulatorOpening('Giải Trình Hoãn Release'),
          },
        ];
      }
      return prev;
    });
  }, [activeLanguage.id]);

  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorRadar, setSimulatorRadar] = useState<any>({
    communication: 84,
    grammar: 78,
    vocabulary: 82,
    pronunciation: 80,
    fluency: 76,
    confidence: 86,
  });
  const [simulatorFeedback, setSimulatorFeedback] = useState<any>(null);

  const handleSimulatorSend = async () => {
    if (!simulatorInput.trim()) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để tham gia mô phỏng tình huống đàm phán thực tế với AI');
      return;
    }
    const userMsg = simulatorInput.trim();
    setSimulatorInput('');

    const newHistory = [...simulatorHistory, { role: 'user', content: userMsg }];
    setSimulatorHistory(newHistory);

    try {
      const res = await api.post('/ai/roleplay', {
        scenarioId: simulatorScenario,
        message: userMsg,
        history: newHistory,
      });
      const data = res.data?.data || res.data;
      if (data?.reply) {
        setSimulatorHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.scores) setSimulatorRadar(data.scores);
        if (data.feedback) setSimulatorFeedback(data.feedback);
        speakText(data.reply);
      }
    } catch {
      const reply = "I understand the technical debt issue. Can you guarantee stability if we push the rollout to tomorrow morning?";
      setSimulatorHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
      speakText(reply);
    }
  };

  // ==========================================
  // TAB 4: ROOT-CAUSE ERROR BANK & HEATMAP
  // ==========================================
  const [errorBankData, setErrorBankData] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'error-bank') {
      api.get('/ai/error-bank')
        .then((res) => setErrorBankData(res.data?.data || res.data))
        .catch(() => {
          setErrorBankData({
            heatmap: { grammar: 68, pronunciation: 72, fluency: 64, vocabulary: 81, listening: 79 },
            errorBank: [
              {
                category: 'Grammar',
                overallScore: 68,
                items: [
                  {
                    rule: 'Third-person singular -s/-es',
                    rootCause: 'Thói quen tiếng Việt không biến đổi đuôi động từ theo ngôi số ít.',
                    occurrences: 14,
                    exampleWrong: 'He work in an international bank.',
                    exampleCorrect: 'He works in an international bank.',
                  },
                  {
                    rule: 'Past Simple tense irregular verbs',
                    rootCause: 'Chưa tự động hóa các động từ bất quy tắc (bought, went, thought).',
                    occurrences: 9,
                    exampleWrong: 'Yesterday I go to see my manager.',
                    exampleCorrect: 'Yesterday I went to see my manager.',
                  },
                ],
              },
            ],
          });
        });
    }
  }, [activeTab]);

  // ==========================================
  // TAB 5: "MAKE ME SOUND BETTER" & REAL CONTENT
  // ==========================================
  const [soundBetterInput, setSoundBetterInput] = useState('I want to make a meeting with you to talk about project');
  const [soundBetterResult, setSoundBetterResult] = useState<any>(null);
  const [soundBetterLoading, setSoundBetterLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleMakeMeSoundBetter = async () => {
    if (!soundBetterInput.trim()) return;
    if (isGuest || !user) {
      promptLogin('Đăng nhập để sử dụng tính năng nâng cấp câu văn chuẩn bản xứ');
      return;
    }
    setSoundBetterLoading(true);
    try {
      const res = await api.post('/ai/sound-better', {
        sentence: soundBetterInput,
      });
      setSoundBetterResult(res.data?.data || res.data);
    } catch {
      setSoundBetterResult({
        yourVersion: soundBetterInput,
        corrected: 'I want to have a meeting with you to discuss the project.',
        natural: 'Could we schedule a quick chat to sync up on the project?',
        professional: 'I would like to arrange a brief meeting with you to review the project status and next steps.',
        nativeStyle: 'Can we carve out 15 minutes to touch base on the project deliverables?',
        grammarExplanation: 'Dùng động từ "discuss" thay cho "talk about" và cụm tự nhiên "schedule a quick chat / arrange a meeting".',
      });
    } finally {
      setSoundBetterLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden space-y-1.5 sm:space-y-2.5">
      {/* Top Product Header (Compact & Streamlined with Dismiss X Button - Hidden on mobile to maximize chat space) */}
      {showHeroBanner ? (
        <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950/90 to-slate-900 text-white shadow-lg border border-indigo-500/20 relative overflow-hidden pr-12 animate-fade-in shrink-0">
          <button
            onClick={dismissHeroBanner}
            className="absolute top-3 right-3 p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition z-20"
            title="Ẩn banner giới thiệu"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-1 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Next-Gen AI Personal English Coach</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              A Personal English Coach That Learns You
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              Huấn luyện viên ghi nhớ lịch sử, tìm nguyên nhân gốc rễ và tự động may đo lộ trình phản xạ cho riêng bạn.
            </p>
          </div>

          <div className="z-10 flex items-center gap-2.5 self-end sm:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block leading-tight">English Power</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 leading-tight">764</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex justify-end shrink-0">
          <button
            onClick={() => {
              setShowHeroBanner(true);
              localStorage.removeItem('leximind_hide_coach_hero');
            }}
            className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition py-0.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Hiện lại banner giới thiệu"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Hiện giới thiệu Coach</span>
          </button>
        </div>
      )}

      {/* 5 Core Feature Tabs - Hidden on mobile (moved to secondary drawer), visible on tablet/desktop */}
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-1.5 sm:pb-2.5 overflow-x-auto scrollbar-none shrink-0 -mx-1 px-1">
        <button
          onClick={() => setActiveTab('voice')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold sm:font-black text-[11px] sm:text-xs transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${activeTab === 'voice'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
        >
          <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">Voice Coach & Real-Time Studio</span>
          <span className="sm:hidden">Voice Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('pronunciation')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold sm:font-black text-[11px] sm:text-xs transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${activeTab === 'pronunciation'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
        >
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">Phòng Luyện Phát Âm (Phoneme Lab)</span>
          <span className="sm:hidden">Luyện Âm</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold sm:font-black text-[11px] sm:text-xs transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${activeTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
        >
          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">Mô Phỏng Tình Huống (Roleplay Simulator)</span>
          <span className="sm:hidden">Mô Phỏng</span>
        </button>

        <button
          onClick={() => setActiveTab('error-bank')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold sm:font-black text-[11px] sm:text-xs transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${activeTab === 'error-bank'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">Ngân Hàng Lỗi Sai (Error Heatmap)</span>
          <span className="sm:hidden">Lỗi Sai</span>
        </button>

        <button
          onClick={() => setActiveTab('sound-better')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold sm:font-black text-[11px] sm:text-xs transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${activeTab === 'sound-better'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Make Me Sound Better (Bản Xứ Hóa)</span>
          <span className="sm:hidden">Bản Xứ Hóa</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: VOICE COACH & REAL-TIME CONVERSATION              */}
      {/* ======================================================== */}
      {activeTab === 'voice' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Controls & Coach Settings */}
          <div className="space-y-3 overflow-y-auto max-h-full pr-1 hidden lg:block">
            {/* Hands-Free 1:1 Call Banner Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-black tracking-wide uppercase text-indigo-300">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    Đối Thoại 1 : 1 Rảnh Tay
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                    }`}>
                    {isCallActive ? (callStatus === 'speaking' ? 'AI Đang Nói' : callStatus === 'thinking' ? 'AI Đang Nghĩ' : 'Đang Nghe Bạn') : 'Chưa Kết Nối'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Nói chuyện trực tiếp 100% không cần bấm nút "Gửi". AI tự nhận diện ngắt câu, trả lời và tự động bật lại micro.
                </p>

                <button
                  onClick={toggleCallMode}
                  className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${isCallActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse'
                      : 'btn-glass-primary shadow-indigo-600/30'
                    }`}
                >
                  {isCallActive ? (
                    <>
                      <PhoneOff className="w-4 h-4" />
                      <span>Kết Thúc Cuộc Gọi 1:1</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Bật Cuộc Gọi Đối Thoại 1:1</span>
                    </>
                  )}
                </button>

                {isCallActive && (
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs text-indigo-300">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-pulse [animation-delay:200ms]" />
                    </span>
                    <span className="text-[11px] font-bold">
                      {callStatus === 'listening' && '🎤 Bạn hãy nói tự nhiên... AI đang lắng nghe'}
                      {callStatus === 'thinking' && '⚡ AI đang phân tích và chuẩn bị câu trả lời...'}
                      {callStatus === 'speaking' && '🔊 AI đang phản hồi giọng nói...'}
                      {callStatus === 'idle' && 'Đang đồng bộ...'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Voice Info (Giọng Nam Bắc chuẩn - Nam Minh) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-purple-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-800 dark:text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  Giọng Đọc AI Coach
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black shadow-xs">
                  Nam Minh (Bắc Chuẩn)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Đọc toàn bộ câu trả lời bằng <strong className="text-indigo-700 dark:text-indigo-300 font-extrabold">Giọng Nam Bắc chuẩn (Nam Minh)</strong>, đọc liền mạch không ngắt quãng giữa câu, phát âm chuẩn cả tiếng Anh và tiếng Việt với tốc độ nhanh, dứt khoát (+25%).
              </p>
            </div>

            {/* Microphone Recording Language Selection */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-500" />
                  Ngôn Ngữ Nhận Diện Micro
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  {speechInputLang === 'vi-VN' ? (
                    <>
                      <CountryFlag languageId="vi" size="xs" />
                      <span>Đang nghe Tiếng Việt</span>
                    </>
                  ) : (
                    <>
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span>Đang nghe {activeLanguage.name}</span>
                    </>
                  )}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setSpeechInputLang('vi-VN');
                    if (recognitionRef.current) {
                      try { recognitionRef.current.lang = 'vi-VN'; } catch (_) { }
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${speechInputLang === 'vi-VN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <CountryFlag languageId="vi" size="xs" />
                  <span>Nói Tiếng Việt</span>
                </button>
                <button
                  onClick={() => {
                    const targetLoc = activeLanguage.speechLocale || 'en-US';
                    setSpeechInputLang(targetLoc);
                    if (recognitionRef.current) {
                      try { recognitionRef.current.lang = targetLoc; } catch (_) { }
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${speechInputLang === activeLanguage.speechLocale
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <CountryFlag languageId={activeLanguage.id} size="xs" />
                  <span>Nói {activeLanguage.name}</span>
                </button>
              </div>
            </div>

            {/* Personality Selector using CustomSelect */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <CustomSelect
                label="AI Coach Personality"
                icon={Smile}
                value={coachPersonality}
                onChange={(val) => setCoachPersonality(String(val))}
                options={[
                  { value: 'Friendly Tutor', label: 'Friendly Tutor', description: 'Kiên nhẫn & Cổ vũ người học' },
                  { value: 'Strict Teacher', label: 'Strict Teacher', description: 'Chỉnh lỗi ngữ pháp nghiêm khắc' },
                  { value: 'Casual Friend', label: 'Casual Friend', description: 'Bạn bè thân thiện, đàm thoại tự nhiên' },
                  { value: 'Work Colleague', label: 'Work Colleague', description: 'Đồng nghiệp công sở, ngôn ngữ văn phòng' },
                  { value: 'Interview Coach', label: 'Interview Coach', description: 'Chuyên gia phỏng vấn việc làm' },
                  { value: 'American Coach', label: 'American Teacher', description: 'Giọng Mỹ chuẩn (General American)' },
                  { value: 'British Coach', label: 'British Teacher', description: 'Giọng Anh chuẩn (Received Pronunciation)' },
                ]}
                className="w-full"
              />
            </div>

            {/* Bilingual Fallback Mode */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Bilingual Fallback (Cứu Cánh Song Ngữ)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setBilingualMode('beginner')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'beginner'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>50%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Beginner</span>
                </button>
                <button
                  onClick={() => setBilingualMode('intermediate')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'intermediate'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>80%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Inter</span>
                </button>
                <button
                  onClick={() => setBilingualMode('advanced')}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${bilingualMode === 'advanced'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>100%</span>
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                  </div>
                  <span className="block text-[9px] opacity-70">Native</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Interactive Voice Chat Stage - Full width edge-to-edge on mobile, rounded card on desktop */}
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-slate-200/80 dark:border-slate-800 shadow-none sm:shadow-xl overflow-hidden flex-1 h-full min-h-0 w-full">
            {/* Dedicated Sleek Chat Box Header */}
            <div className="px-2.5 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Studio Secondary Drawer Button */}
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-black text-xs shrink-0 transition active:scale-95"
                  title="Mở Studio & Cài đặt"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-extrabold text-[11px]">Studio</span>
                </button>

                <div className="relative shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" title="AI Coach Sẵn Sàng" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white truncate leading-tight">
                      VocalFlow AI Coach
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live • {coachPersonality}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="sm:hidden font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                      {coachPersonality} • {bilingualMode === 'beginner' ? '50%' : bilingualMode === 'intermediate' ? '80%' : '100%'}
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                    </span>
                    <span className="hidden sm:inline">Gia sư đàm thoại & sửa lỗi ngữ cảnh thời gian thực</span>
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* AI Voice Badge: Giọng Nam Bắc Chuẩn */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs font-black shadow-xs select-none"
                  title="AI đọc toàn bộ câu trả lời bằng giọng Nam Bắc chuẩn (Nam Minh) đọc nhanh dứt khoát 1.25x"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Nam Minh (Bắc Chuẩn)</span>
                </div>

                <button
                  onClick={toggleCallMode}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${isCallActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                  title={isCallActive ? 'Dừng cuộc gọi thoại' : 'Bật đàm thoại giọng nói 1:1'}
                >
                  {isCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="hidden sm:inline">{isCallActive ? 'Dừng Gọi' : 'Gọi 1:1'}</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Bạn có muốn làm mới cuộc trò chuyện này?')) {
                      const greeting = getAILanguageGreeting(activeLanguage.id);
                      setMessages([
                        {
                          id: 'welcome-' + Date.now(),
                          role: 'assistant',
                          content: greeting.content,
                          viTranslation: greeting.viTranslation,
                          timestamp: new Date(),
                        },
                      ]);
                    }
                  }}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
                  title="Làm mới cuộc trò chuyện"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Call Mode Status Bar */}
            {isCallActive && (
              <div className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white flex items-center justify-between text-[11px] sm:text-xs font-bold shadow-md shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>Cuộc gọi 1:1 Đang Hoạt Động</span>
                </div>
                <span className="text-[10px] sm:text-[11px] opacity-90 hidden xs:inline">Tự nhận diện khi dừng nói 1.4s</span>
              </div>
            )}

            {/* Chat Log */}
            <div className="flex-1 p-2.5 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <div className="max-w-md p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed bg-indigo-600 text-white rounded-br-none shadow-md">
                      <p>{msg.content}</p>
                      {msg.viTranslation && (
                        <p className="mt-2 pt-2 border-t border-indigo-400 text-[11px] text-indigo-100 italic">
                          💡 {msg.viTranslation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-xl w-full">
                      <RichAIMessageRenderer
                        content={msg.content}
                        provider={(msg as any).provider}
                        onSelectQuizOption={(opt) => handleSend(opt)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {coachLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span>Huấn luyện viên đang suy nghĩ và chuẩn bị phản hồi...</span>
                </div>
              )}
            </div>

            {/* "What Should I Say?" Scaffolding Help Bar */}
            <div className="px-3 sm:px-6 py-1 sm:py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto scrollbar-none">
              <span className="text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 mr-2 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Bị bí từ?</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setWhatShouldISayStep(1)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Gợi ý ý tưởng
                </button>
                <button
                  onClick={() => setWhatShouldISayStep(2)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Từ then chốt
                </button>
                <button
                  onClick={() => setWhatShouldISayStep(3)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                >
                  Mẫu câu
                </button>
              </div>
            </div>

            {whatShouldISayStep && (
              <div className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs border-t border-amber-500/20 flex items-center justify-between gap-2">
                <div className="flex-1">
                  {whatShouldISayStep === 1 && (
                    <span>💡 <strong>Gợi ý:</strong> Chia sẻ về 1 trở ngại bạn đã vượt qua trong công việc hôm nay.</span>
                  )}
                  {whatShouldISayStep === 2 && (
                    <span>🔑 <strong>Từ then chốt:</strong> resolved / bottleneck / coordinated / team deliverables.</span>
                  )}
                  {whatShouldISayStep === 3 && (
                    <span>📝 <strong>Mẫu câu:</strong> "Today, my team successfully coordinated to resolve a major delivery bottleneck."</span>
                  )}
                </div>
                <button
                  onClick={() => setWhatShouldISayStep(null)}
                  className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-300 shrink-0"
                  title="Đóng gợi ý"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Autocomplete & Cached Prompt Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mx-2 sm:mx-4 mb-2 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-100 dark:border-slate-800 shadow-xl space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>Gợi ý câu hỏi & từ khóa từ dữ liệu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Tiết kiệm 100% Token
                    </span>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Đóng gợi ý"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60">
                  {suggestions.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => {
                        setTranscript(item.title);
                        setShowSuggestions(false);
                        handleSendMessage(item.title);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.hasCache ? (
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-400" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate">
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${item.hasCache
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}
                      >
                        {item.hasCache ? '⚡ Có sẵn' : item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Input & Action Bar */}
            <div className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Sleek Language Switch Button (Tiếng Việt <-> [Ngôn ngữ đang học]) */}
              <button
                type="button"
                onClick={() => {
                  const targetLoc = activeLanguage.speechLocale || 'en-US';
                  const nextLang = speechInputLang === 'vi-VN' ? targetLoc : 'vi-VN';
                  setSpeechInputLang(nextLang);
                  if (recognitionRef.current) {
                    try { recognitionRef.current.lang = nextLang; } catch (_) { }
                  }
                }}
                className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl border text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs select-none ${speechInputLang === 'vi-VN'
                    ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                  }`}
                title={`Bấm để đổi ngôn ngữ thu âm Micro: Tiếng Việt (vi-VN) hoặc ${activeLanguage.name} (${activeLanguage.speechLocale})`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${speechInputLang === 'vi-VN' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'
                    }`}
                />
                <span className="font-extrabold flex items-center gap-1">
                  {speechInputLang === 'vi-VN' ? (
                    <>
                      <CountryFlag languageId="vi" size="xs" />
                      <span>Tiếng Việt</span>
                    </>
                  ) : (
                    <>
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span>{activeLanguage.name}</span>
                    </>
                  )}
                </span>
              </button>

              {/* Refined Push-To-Talk Microphone Button (Ấn giữ để nói, thả tay để gửi) */}
              <button
                type="button"
                onPointerDown={handleHoldStart}
                onPointerUp={handleHoldEnd}
                onPointerLeave={() => { if (isHoldingToRecord) handleHoldEnd(); }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 select-none cursor-pointer active:scale-95 border ${isListening || isHoldingToRecord
                    ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                  }`}
                title="Ấn và GIỮ để nói, THẢ RA để gửi tin nhắn phân tích"
              >
                {isListening || isHoldingToRecord ? (
                  <Mic className="w-5 h-5 text-white animate-bounce" />
                ) : (
                  <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>

              <input
                type="text"
                value={transcript}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    handleSendMessage();
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder={
                  isCallActive
                    ? 'Chế độ 1:1 bật — hãy nói...'
                    : isHoldingToRecord || isListening
                      ? `🔴 Đang lắng nghe... Thả tay để gửi`
                      : `Ấn giữ Micro để nói, hoặc gõ câu hỏi...`
                }
                className="flex-1 h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <button
                onClick={() => {
                  setShowSuggestions(false);
                  handleSendMessage();
                }}
                disabled={!transcript.trim() || coachLoading}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PRONUNCIATION LAB & SHADOWING                     */}
      {/* ======================================================== */}
      {activeTab === 'pronunciation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Word list to test with Custom Add & Flashcard import */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Danh sách từ luyện âm
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLoadUserFlashcards}
                  disabled={loadingFlashcards}
                  className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-black transition flex items-center gap-1 whitespace-nowrap"
                  title="Nạp từ vựng từ bộ thẻ Flashcard của bạn"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{loadingFlashcards ? 'Đang tải...' : 'Lấy từ thẻ'}</span>
                </button>
                <button
                  onClick={() => setShowAddWordModal(true)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                  title="Thêm từ vựng riêng của bạn vào danh sách"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add Custom Word Mini Modal / Dropdown */}
            {showAddWordModal && (
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/40 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white">Thêm từ luyện phát âm</span>
                  <button onClick={() => setShowAddWordModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Từ tiếng Anh (VD: negotiation)"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Phiên âm (tùy chọn)"
                    value={customIpaInput}
                    onChange={(e) => setCustomIpaInput(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="Ý nghĩa tiếng Việt"
                    value={customMeaningInput}
                    onChange={(e) => setCustomMeaningInput(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]"
                  />
                </div>
                <button
                  onClick={handleAddCustomWord}
                  disabled={!customWordInput.trim()}
                  className="w-full py-1.5 rounded-xl btn-glass-primary text-xs font-black"
                >
                  Thêm Vào Danh Sách Luyện
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {practiceWords.map((item) => (
                <div
                  key={item.word}
                  onClick={() => {
                    setSelectedWord(item.word);
                    evaluatePronunciationMatch(item.word, item.word);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${selectedWord === item.word
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{item.word}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                        {item.phoneme}
                      </span>
                      {item.isCustom && (
                        <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                          Thẻ của bạn
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{item.ipa} • {item.meaning}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(item.word);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 transition"
                    title={`Nghe phát âm chuẩn ${activeLanguage.name}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis & Mouth/Tongue Articulation Guide */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Từ Đang Phân Tích</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 flex items-center gap-1">
                      <CountryFlag languageId={activeLanguage.id} size="xs" />
                      <span>{activeLanguage.name} ({activeLanguage.speechLocale})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{selectedWord}</h2>
                    <button
                      onClick={() => speakWord(selectedWord)}
                      className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition"
                      title={`Nghe phát âm bản xứ (${activeLanguage.name})`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Controls: Listen / Replay Native / Record / Replay User Recording */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Native Listen / Replay Button */}
                  <button
                    type="button"
                    onClick={() => speakWord(selectedWord, 1.0)}
                    className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                    title={`Nghe lại phát âm bản xứ chuẩn (${activeLanguage.name})`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="flex items-center gap-1">
                      Nghe chuẩn <CountryFlag languageId={activeLanguage.id} size="xs" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakWord(selectedWord, 0.75)}
                    className="px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
                    title="Nghe lại ở tốc độ chậm 0.75x"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chậm 0.75x</span>
                  </button>

                  {/* Microphone Record / Stop Button */}
                  {!isPronRecording ? (
                    <button
                      type="button"
                      onClick={handleStartPronRecording}
                      className="px-4 py-2.5 rounded-2xl btn-glass-primary text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 transition active:scale-95"
                      title={`Thu âm nhận diện giọng ${activeLanguage.name} (${activeLanguage.speechLocale})`}
                    >
                      <Mic className="w-4 h-4" />
                      <span className="flex items-center gap-1">
                        <span>{pronRecordedUrl ? 'Thu lại' : 'Thu âm'}</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopPronRecording}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition active:scale-95 animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span className="flex items-center gap-1">
                        <span>Dừng mic</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>({pronRecordingSeconds < 10 ? `0${pronRecordingSeconds}` : pronRecordingSeconds}s)</span>
                      </span>
                    </button>
                  )}

                  {/* Replay User Recording Button */}
                  {pronRecordedUrl && (
                    <button
                      type="button"
                      onClick={handleToggleReplayPronRecording}
                      className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-sm flex items-center gap-2 transition active:scale-95 ${isPlayingPronRecording
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                    >
                      {isPlayingPronRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlayingPronRecording ? 'Đang nghe giọng bạn...' : 'Nghe lại bản thu của bạn'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Banner if mic permission issue */}
              {pronRecErrorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pronRecErrorMessage}</span>
                </div>
              )}

              {recordedSpokenWord && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-500 whitespace-nowrap">Giọng nói nhận diện được:</span>
                  <span className="font-black text-slate-800 dark:text-white">"{recordedSpokenWord}"</span>
                </div>
              )}

              {pronunciationResult && (
                <div className="space-y-4">
                  {/* Pass/Fail Status Banner (Adult threshold > 90%) */}
                  <div
                    className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${pronunciationResult.isPassing
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {pronunciationResult.isPassing ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>
                            {pronunciationResult.isPassing
                              ? 'ĐẠT CHUẨN PHÁT ÂM (>90%)'
                              : 'CHƯA ĐẠT (Yêu cầu người lớn >90%)'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${pronunciationResult.isPassing
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            {pronunciationResult.accuracy}% / 100%
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
                          {pronunciationResult.feedback ||
                            (pronunciationResult.isPassing
                              ? 'Phát âm chuẩn âm vị, ngữ điệu và trọng âm đạt yêu cầu bài thi.'
                              : `Cần đạt trên 90% để vượt qua. Bạn đạt ${pronunciationResult.accuracy}%. Hãy nghe lại từ mẫu và đọc rõ từng âm.`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ Chính Xác Âm Vị</span>
                      <span
                        className={`text-2xl font-black ${pronunciationResult.isPassing ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                      >
                        {pronunciationResult.accuracy}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Trọng Âm (Stress)</span>
                      <span className="text-2xl font-black text-indigo-500">{pronunciationResult.prosody?.stressAccuracy}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nhịp Điệu (Rhythm)</span>
                      <span className="text-2xl font-black text-amber-500">{pronunciationResult.prosody?.rhythmScore}%</span>
                    </div>
                  </div>

                  {/* Articulation Guide Box */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                    <span className="font-black text-sm block">👅 Hướng dẫn Khẩu Hình & Vị Trí Đặt Lưỡi ({pronunciationResult.phonemeAnalysis?.targetPhoneme}):</span>
                    <p><strong>Vị trí lưỡi:</strong> {pronunciationResult.phonemeAnalysis?.tonguePositionGuide}</p>
                    <p><strong>Kỹ thuật đẩy hơi:</strong> {pronunciationResult.phonemeAnalysis?.techniqueTips}</p>
                    <p className="text-rose-600 dark:text-rose-400 font-bold">⚠️ Lưu ý: {pronunciationResult.phonemeAnalysis?.pitfallAlert}</p>
                  </div>

                  {/* Shadowing Mode Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs space-y-2">
                    <span className="font-black block">🎧 Chế Độ Shadowing (Nhại Giọng Bản Xứ):</span>
                    <p className="text-slate-500 dark:text-slate-400">
                      1. Bấm loa để nghe người bản xứ đọc mẫu 2 lần. <br />
                      2. Nhại lại ngay lập tức theo ngữ điệu và ngữ âm, không ngắt quãng câu.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const shadowingMap: Record<string, string> = {
                          en: 'I thoroughly inspected the code before deployment.',
                          de: 'Ich habe den Code vor der Bereitstellung gründlich überprüft.',
                          ja: '本番リリースの前にコードを徹底的に検証しました。',
                          zh: '我们在系统部署之前仔细检查了所有代码。',
                          fr: "J'ai inspecté minutieusement le code avant le déploiement.",
                          es: 'Inspeccioné a fondo el código antes del despliegue.',
                          ko: '배포 전에 코드를 철저하게 검토했습니다.',
                        };
                        const sentence = shadowingMap[activeLanguage.id] || shadowingMap.en;
                        speakWord(sentence, 0.9);
                      }}
                      className="mt-2 px-3 py-1.5 rounded-xl btn-glass-primary font-bold flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="flex items-center gap-1.5">
                        <span>Nghe câu mẫu Shadowing</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>({activeLanguage.name})</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REAL-WORLD SIMULATOR (ROLEPLAY)                   */}
      {/* ======================================================== */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Chooser */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
              Kịch Bản Tình Huống Thực Tế
            </span>
            <div className="space-y-2">
              {[
                { id: 'job_interview', name: 'Phỏng Vấn Tech Job', desc: 'Đối thoại với Giám đốc Kỹ thuật về kinh nghiệm và xử lý sự cố.' },
                { id: 'bug_delay_meeting', name: 'Giải Trình Hoãn Release', desc: 'Thuyết phục VP Sản phẩm về việc lùi thời gian do bug nghiêm trọng.' },
                { id: 'salary_negotiation', name: 'Đàm Phán Tăng Lương', desc: 'Đưa ra luận điểm tăng 25% thu nhập dựa trên hiệu suất.' },
                { id: 'dining_out', name: 'Gọi Món Nhà Hàng', desc: 'Yêu cầu món ăn theo chế độ ăn uống và hỏi kỹ thành phần.' },
              ].map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => {
                    setSimulatorScenario(sc.id);
                    const greeting = getAILanguageGreeting(activeLanguage.id);
                    setSimulatorHistory([{ role: 'assistant', content: greeting.simulatorOpening(sc.name) }]);
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${simulatorScenario === sc.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{sc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
                </div>
              ))}
            </div>

            {/* Radar Scores Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                Bảng Điểm Radar Kỹ Năng
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Giao Tiếp</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.communication}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Ngữ Pháp</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.grammar}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Từ Vựng</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{simulatorRadar.vocabulary}/100</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">Độ Tự Tin</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{simulatorRadar.confidence}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roleplay Chat Window */}
          <div className={`lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${showHeroBanner ? 'min-h-[560px] h-[calc(100vh-17rem)]' : 'min-h-[660px] h-[calc(100vh-10.5rem)]'
            }`}>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {simulatorHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${item.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}
                  >
                    <p>{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {simulatorFeedback && (
              <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300">
                <p><strong>Điểm cộng:</strong> {simulatorFeedback.greatPoint}</p>
                <p className="mt-1"><strong>Nâng cấp gợi ý:</strong> {simulatorFeedback.betterWayToSay}</p>
              </div>
            )}

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <input
                type="text"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulatorSend()}
                placeholder="Ứng biến câu trả lời của bạn trong tình huống này..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSimulatorSend}
                className="btn-glass-primary !shadow-none px-5 py-3 rounded-2xl font-extrabold text-xs transition"
              >
                Phản xạ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ROOT-CAUSE ERROR BANK & HEATMAP                   */}
      {/* ======================================================== */}
      {activeTab === 'error-bank' && (
        <div className="space-y-6">
          {/* Heatmap Bar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-lg font-black tracking-tight">Bản Đồ Nhiệt Điểm Yếu (English Weakness Heatmap)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Ngữ Pháp', score: 68, color: 'text-amber-500', bar: 'w-[68%]' },
                { label: 'Phát Âm', score: 72, color: 'text-indigo-500', bar: 'w-[72%]' },
                { label: 'Độ Lưu Loát', score: 64, color: 'text-rose-500', bar: 'w-[64%]' },
                { label: 'Vốn Từ Vựng', score: 81, color: 'text-emerald-500', bar: 'w-[81%]' },
                { label: 'Nghe Hiểu', score: 79, color: 'text-cyan-500', bar: 'w-[79%]' },
              ].map((item) => (
                <div key={item.label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs text-slate-400 font-bold block">{item.label}</span>
                  <span className={`text-2xl font-black ${item.color} mt-1 block`}>{item.score}/100</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full bg-indigo-500 rounded-full ${item.bar}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Bank Root Cause Cards */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
              Lỗi Sai Lặp Lại & Nguyên Nhân Gốc Rễ (Root Cause Analysis)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Ngôi thứ 3 số ít (He/She/It + V-s/es)',
                  occurrences: 14,
                  root: 'Thói quen tư duy tiếng Việt không chia động từ theo ngôi số ít.',
                  wrong: 'He work in an international bank.',
                  correct: 'He works in an international bank.',
                },
                {
                  title: 'Động từ bất quy tắc thì Quá Khứ Đơn',
                  occurrences: 9,
                  root: 'Chưa tự động hóa các động từ quen thuộc (went, bought, thought, brought).',
                  wrong: 'Yesterday I go to meet the client.',
                  correct: 'Yesterday I went to meet the client.',
                },
                {
                  title: 'Nuốt âm cuối Consonant (/s/, /z/, /t/, /d/)',
                  occurrences: 18,
                  root: 'Tiếng Việt là ngôn ngữ đơn âm tiết, người học hay bỏ quên âm đuôi.',
                  wrong: 'I like this product (thiếu âm /k/)',
                  correct: 'I like [laɪk] this product.',
                },
                {
                  title: 'Dùng sai giới từ chỉ thời gian (In / On / At)',
                  occurrences: 7,
                  root: 'Dịch nghĩa đen từ "ở/vào" từ tiếng Việt sang tiếng Anh.',
                  wrong: 'I will call you in Monday morning.',
                  correct: 'I will call you on Monday morning.',
                },
              ].map((err, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm">{err.title}</h3>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                      {err.occurrences} lần lặp lại
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Nguyên nhân gốc rễ:</strong> {err.root}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                    <div className="text-rose-500 font-semibold line-through">❌ {err.wrong}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">✅ {err.correct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: "MAKE ME SOUND BETTER" (BẢN XỨ HÓA)               */}
      {/* ======================================================== */}
      {activeTab === 'sound-better' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>"Make Me Sound Better" — Nâng Cấp Câu Nói Sang Chuẩn Bản Xứ</span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhập bất kỳ câu tiếng Anh nào của bạn. AI sẽ chuyển đổi câu qua 4 cấp độ: Chuẩn ngữ pháp &rarr; Tự nhiên đời thường &rarr; Chuyên nghiệp công sở &rarr; Đậm chất bản xứ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={soundBetterInput}
                onChange={(e) => setSoundBetterInput(e.target.value)}
                placeholder="Nhập câu bạn muốn nói (ví dụ: I want to talk about project...)"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleMakeMeSoundBetter}
                disabled={soundBetterLoading || !soundBetterInput.trim()}
                className="btn-glass-primary !shadow-none w-full sm:w-auto px-6 py-3 rounded-2xl disabled:opacity-50 font-extrabold text-xs transition shrink-0"
              >
                {soundBetterLoading ? 'Đang nâng cấp...' : 'Bản Xứ Hóa Ngay'}
              </button>
            </div>
          </div>

          {soundBetterResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Correct Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    1. Correct (Chuẩn Ngữ Pháp)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.corrected, 'corrected')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'corrected' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{soundBetterResult.corrected}</p>
                <span className="text-[11px] text-slate-400 block">Sửa sạch lỗi chia thì, chính tả và cấu trúc câu.</span>
              </div>

              {/* 2. Natural Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                    2. Natural (Tự Nhiên Hàng Ngày)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.natural, 'natural')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'natural' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{soundBetterResult.natural}</p>
                <span className="text-[11px] text-slate-400 block">Cách người bản xứ trò chuyện tự nhiên ngoài đời thật.</span>
              </div>

              {/* 3. Professional Version */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
                    3. Professional (Công Sở & Email)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.professional, 'professional')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'professional' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{soundBetterResult.professional}</p>
                <span className="text-[11px] text-slate-400 block">Trang trọng, lịch thiệp, phù hợp gửi sếp và đối tác.</span>
              </div>

              {/* 4. Native-like Style */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-2 border-indigo-500/30 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase">
                    4. Native-Style (Văn Phong Bản Xứ Đậm Đà)
                  </span>
                  <button
                    onClick={() => copyToClipboard(soundBetterResult.nativeStyle, 'nativeStyle')}
                    className="text-slate-400 hover:text-indigo-600 transition"
                  >
                    {copiedKey === 'nativeStyle' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">{soundBetterResult.nativeStyle}</p>
                <span className="text-[11px] text-slate-400 block">Sử dụng phrasal verbs, idioms và nhịp điệu sinh động.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Secondary Drawer (Drawer Phụ gom toàn bộ chức năng & cài đặt để tối ưu 100% diện tích cho khung chat) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[86%] max-w-[340px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col p-4 space-y-4 overflow-y-auto animate-slide-in-left z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Studio & Cài Đặt</h3>
                  <p className="text-[10px] text-slate-400">Chọn phòng luyện & tùy biến Coach</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1:1 Voice Call Quick Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 text-white space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-emerald-400" />
                  Đối Thoại 1:1 Rảnh Tay
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                  {isCallActive ? 'Đang Bật' : 'Chưa Bật'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Nói chuyện liên tục không cần bấm nút gửi. AI tự ngắt câu và phản hồi giọng nói.
              </p>
              <button
                onClick={() => {
                  toggleCallMode();
                  setMobileDrawerOpen(false);
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${isCallActive ? 'bg-rose-600 text-white' : 'btn-glass-primary'
                  }`}
              >
                {isCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isCallActive ? 'Tắt Cuộc Gọi 1:1' : 'Bật Cuộc Gọi 1:1 Rảnh Tay'}</span>
              </button>
            </div>

            {/* 5 Studio Feature Rooms */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                Phòng Luyện Chức Năng
              </span>
              {[
                { id: 'voice', name: 'Voice Coach & Real-Time', icon: Mic, desc: 'Đàm thoại phản xạ 1:1' },
                { id: 'pronunciation', name: 'Phòng Luyện Phát Âm', icon: Volume2, desc: 'Phoneme Lab & Shadowing' },
                { id: 'simulator', name: 'Mô Phỏng Tình Huống', icon: Briefcase, desc: 'Roleplay phỏng vấn & công việc' },
                { id: 'error-bank', name: 'Ngân Hàng Lỗi Sai', icon: BrainCircuit, desc: 'Error Heatmap & sửa lỗi' },
                { id: 'sound-better', name: 'Make Me Sound Better', icon: Sparkles, desc: 'Bản xứ hóa câu văn' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition ${isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate">{tab.name}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{tab.desc}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Coach Settings */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                Cài Đặt Huấn Luyện Viên
              </span>

              {/* AI Voice Selection (Default: Giọng Việt / Ngọc Huyền) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <label className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    Giọng Nói AI Coach
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                    {voiceLang === 'vi' ? 'Ngọc Huyền 2.0 (Mặc định)' : 'Native English'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handleVoiceLangChange('vi')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${voiceLang === 'vi'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <span>Giọng Tiếng Việt</span>
                  </button>
                  <button
                    onClick={() => handleVoiceLangChange('en')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${voiceLang === 'en'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <span>Giọng Tiếng Anh</span>
                  </button>
                </div>
              </div>

              {/* Microphone Recording Language Selection */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-indigo-500" />
                    Ngôn Ngữ Nhận Diện Micro
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    {speechInputLang === 'vi-VN' ? (
                      <>
                        <CountryFlag languageId="vi" size="xs" />
                        <span>Đang nghe Tiếng Việt</span>
                      </>
                    ) : (
                      <>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                        <span>Đang nghe {activeLanguage.name}</span>
                      </>
                    )}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeechInputLang('vi-VN');
                      if (recognitionRef.current) {
                        try { recognitionRef.current.lang = 'vi-VN'; } catch (_) { }
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${speechInputLang === 'vi-VN'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <CountryFlag languageId="vi" size="xs" />
                    <span>Nói Tiếng Việt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetLoc = activeLanguage.speechLocale || 'en-US';
                      setSpeechInputLang(targetLoc);
                      if (recognitionRef.current) {
                        try { recognitionRef.current.lang = targetLoc; } catch (_) { }
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${speechInputLang !== 'vi-VN'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <CountryFlag languageId={activeLanguage.id} size="xs" />
                    <span>Nói {activeLanguage.name}</span>
                  </button>
                </div>
              </div>

              {/* Personality */}
              <CustomSelect
                label="Tính cách AI Coach"
                icon={Smile}
                value={coachPersonality}
                onChange={(val) => setCoachPersonality(String(val))}
                options={[
                  { value: 'Friendly Tutor', label: 'Friendly Tutor', description: 'Kiên nhẫn & Cổ vũ người học' },
                  { value: 'Strict Teacher', label: 'Strict Teacher', description: 'Chỉnh lỗi ngữ pháp nghiêm khắc' },
                  { value: 'Casual Friend', label: 'Casual Friend', description: 'Bạn bè thân thiện, đàm thoại tự nhiên' },
                  { value: 'Work Colleague', label: 'Work Colleague', description: 'Đồng nghiệp công sở' },
                  { value: 'Interview Coach', label: 'Interview Coach', description: 'Chuyên gia phỏng vấn' },
                  { value: 'American Coach', label: 'American Teacher', description: 'Giọng Mỹ chuẩn' },
                  { value: 'British Coach', label: 'British Teacher', description: 'Giọng Anh chuẩn' },
                ]}
                className="w-full text-xs"
              />

              {/* Bilingual fallback */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Cứu cánh song ngữ</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBilingualMode(m)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${bilingualMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{m === 'beginner' ? '50%' : m === 'intermediate' ? '80%' : '100%'}</span>
                        <CountryFlag languageId={activeLanguage.id} size="xs" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fearless Speaking Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nói không sợ sai</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    Mức {fearlessLevel}/3
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  value={fearlessLevel}
                  onChange={(e) => setFearlessLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  {fearlessLevel === 1 && 'Sửa mọi lỗi ngữ pháp & phát âm ngay lập tức.'}
                  {fearlessLevel === 2 && 'Cân bằng giao tiếp tự nhiên và góp ý điểm cốt lõi.'}
                  {fearlessLevel === 3 && 'Tối đa độ trôi chảy, không ngắt lời.'}
                </p>
              </div>
            </div>

            {/* Close Drawer Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl btn-glass-primary font-bold text-xs"
              >
                Xong & Tiếp Tục Trò Chuyện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
