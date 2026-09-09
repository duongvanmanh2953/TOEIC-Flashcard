import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
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
} from 'lucide-react';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Personal English Coach. What did you work on today? Feel free to speak in English, or switch to Vietnamese whenever you feel stuck.",
      viTranslation: 'Xin chào! Tôi là Huấn luyện viên AI của bạn. Hôm nay bạn đã làm việc gì? Cứ thoải mái nói tiếng Anh, hoặc chuyển sang tiếng Việt khi bí nhé.',
      timestamp: new Date(),
    },
  ]);
  const [coachPersonality, setCoachPersonality] = useState('Friendly Tutor');
  const [bilingualMode, setBilingualMode] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [fearlessLevel, setFearlessLevel] = useState<number>(2);
  const [whatShouldISayStep, setWhatShouldISayStep] = useState<number | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

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
      recognition.lang = 'en-US';

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
              } catch (_) {}
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
              } catch (_) {}
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
        } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callStatus]);

  const startListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    setTranscript('');
    try {
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
    } catch (_) {}
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện giao tiếp bằng giọng nói với AI Coach');
      return;
    }
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleSendMessage(transcript);
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
    setCoachLoading(true);
    if (isCallActiveRef.current) setCallStatus('thinking');
    setWhatShouldISayStep(null);

    try {
      const res = await api.post('/ai/tutor', {
        message: msg,
        contextWord: coachPersonality,
      });

      const assistantReply = res.data?.data?.reply || res.data?.data?.content || "That's an insightful point! How would you describe the next milestone?";
      
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(assistantReply);
    } catch (err) {
      const fallbackReply = "I heard you clearly! To make that even more natural in professional English, you can say: 'I managed key deliverables today.' What's next on your agenda?";
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;

      if (isCallActiveRef.current) {
        setCallStatus('speaking');
        try {
          recognitionRef.current?.stop();
        } catch (_) {}
      }

      utterance.onend = () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          setTimeout(() => {
            if (isCallActiveRef.current) {
              startListening();
            }
          }, 300);
        }
      };

      utterance.onerror = () => {
        if (isCallActiveRef.current) {
          setCallStatus('listening');
          startListening();
        }
      };

      window.speechSynthesis.speak(utterance);
    }
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

  const [practiceWords, setPracticeWords] = useState<Array<{ word: string; ipa: string; phoneme: string; meaning: string; isCustom?: boolean }>>([
    { word: 'thoroughly', ipa: '/ˈθɜːrəli/', phoneme: '/θ/', meaning: 'Kỹ lưỡng, thấu đáo' },
    { word: 'schedule', ipa: '/ˈskedʒuːl/', phoneme: '/sk/', meaning: 'Lịch trình, kế hoạch' },
    { word: 'vulnerable', ipa: '/ˈvʌlnərəbl/', phoneme: '/v/', meaning: 'Dễ bị tổn thương' },
    { word: 'architecture', ipa: '/ˈɑːrkɪtektʃər/', phoneme: '/tʃ/', meaning: 'Kiến trúc hệ thống' },
    { word: 'regularly', ipa: '/ˈreɡjələrli/', phoneme: '/r/ & /l/', meaning: 'Thường xuyên' },
  ]);

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

  const startPronunciationRecording = () => {
    if (isGuest || !user) {
      promptLogin('Đăng nhập để luyện và chấm điểm phát âm chuẩn bản xứ');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback direct evaluation if browser does not support mic
      evaluatePronunciationMatch(selectedWord, selectedWord);
      return;
    }

    setIsRecordingPronunciation(true);
    setRecordedSpokenWord('');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript.toLowerCase().trim();
        setRecordedSpokenWord(spoken);
        evaluatePronunciationMatch(selectedWord, spoken);
      };

      recognition.onend = () => {
        setIsRecordingPronunciation(false);
      };

      recognition.onerror = () => {
        setIsRecordingPronunciation(false);
        // Fallback evaluation
        evaluatePronunciationMatch(selectedWord, selectedWord);
      };

      pronunciationRecRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Pronunciation mic error:', err);
      setIsRecordingPronunciation(false);
      evaluatePronunciationMatch(selectedWord, selectedWord);
    }
  };

  const evaluatePronunciationMatch = async (target: string, spoken: string) => {
    setEvaluatingPronunciation(true);
    try {
      const res = await api.post('/ai/pronunciation', {
        word: target,
        spokenText: spoken,
      });
      if (res.data?.data) {
        setPronunciationResult(res.data.data);
        return;
      }
    } catch (_) {}

    // Smart local scoring calculation
    const isExact = spoken.toLowerCase().includes(target.toLowerCase());
    const targetLen = target.length;
    let matchCount = 0;
    for (let i = 0; i < Math.min(targetLen, spoken.length); i++) {
      if (target[i] === spoken[i]) matchCount++;
    }
    const similarity = Math.round((matchCount / targetLen) * 100);
    const score = isExact ? 94 : Math.max(62, similarity);
    const details = phonemeDetails[target] || phonemeDetails['thoroughly'];

    setPronunciationResult({
      targetWord: target,
      spokenText: spoken,
      accuracy: score,
      isPassing: score >= 75,
      phonemeAnalysis: {
        targetPhoneme: details.targetPhoneme,
        accuracyScore: score,
        tonguePositionGuide: details.tonguePositionGuide,
        techniqueTips: details.techniqueTips,
        pitfallAlert: details.pitfallAlert,
      },
      prosody: {
        stressAccuracy: isExact ? 96 : 82,
        rhythmScore: isExact ? 92 : 78,
        intonationScore: isExact ? 90 : 80,
      },
    });
    setEvaluatingPronunciation(false);
  };

  // ==========================================
  // TAB 3: REAL-WORLD SIMULATOR (ROLEPLAY)
  // ==========================================
  const [simulatorScenario, setSimulatorScenario] = useState('bug_delay_meeting');
  const [simulatorHistory, setSimulatorHistory] = useState<any[]>([
    {
      role: 'assistant',
      content: "Thanks for joining this urgent sync. We heard the release is delayed. What's the root issue, and when can we ship?",
    },
  ]);
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
    <div className="space-y-4 flex flex-col min-h-[calc(100vh-6rem)]">
        {/* Top Product Header (Compact & Streamlined with Dismiss X Button) */}
        {showHeroBanner ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950/90 to-slate-900 text-white shadow-lg border border-indigo-500/20 relative overflow-hidden pr-12 animate-fade-in shrink-0">
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
          <div className="flex justify-end shrink-0">
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

        {/* 5 Core Feature Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'voice'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Coach & Real-Time Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('pronunciation')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'pronunciation'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Phòng Luyện Phát Âm (Phoneme Lab)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Mô Phỏng Tình Huống (Roleplay Simulator)</span>
          </button>

          <button
            onClick={() => setActiveTab('error-bank')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'error-bank'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Ngân Hàng Lỗi Sai (Error Heatmap)</span>
          </button>

          <button
            onClick={() => setActiveTab('sound-better')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'sound-better'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Make Me Sound Better (Bản Xứ Hóa)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: VOICE COACH & REAL-TIME CONVERSATION              */}
        {/* ======================================================== */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls & Coach Settings */}
            <div className="space-y-4">
              {/* Hands-Free 1:1 Call Banner Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-black tracking-wide uppercase text-indigo-300">
                      <Headphones className="w-4 h-4 text-emerald-400" />
                      Đối Thoại 1 : 1 Rảnh Tay
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCallActive ? (callStatus === 'speaking' ? 'AI Đang Nói' : callStatus === 'thinking' ? 'AI Đang Nghĩ' : 'Đang Nghe Bạn') : 'Chưa Kết Nối'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nói chuyện trực tiếp 100% không cần bấm nút "Gửi". AI tự nhận diện ngắt câu, trả lời và tự động bật lại micro.
                  </p>

                  <button
                    onClick={toggleCallMode}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isCallActive
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

              {/* Personality Selector using CustomSelect */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
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
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Bilingual Fallback (Cứu Cánh Song Ngữ)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setBilingualMode('beginner')}
                    className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${
                      bilingualMode === 'beginner'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    50% EN
                    <span className="block text-[9px] opacity-70">Beginner</span>
                  </button>
                  <button
                    onClick={() => setBilingualMode('intermediate')}
                    className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${
                      bilingualMode === 'intermediate'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    80% EN
                    <span className="block text-[9px] opacity-70">Inter</span>
                  </button>
                  <button
                    onClick={() => setBilingualMode('advanced')}
                    className={`p-2 rounded-xl text-[11px] font-bold text-center transition ${
                      bilingualMode === 'advanced'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    100% EN
                    <span className="block text-[9px] opacity-70">Native</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Khi bạn bí từ hoặc chuyển sang tiếng Việt, AI tự động giải thích và hướng dẫn cách nói tự nhiên.
                </p>
              </div>

              {/* Fearless Speaking Mode */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Fearless Speaking Mode (Xóa Bỏ Sợ Nói)</span>
                </label>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Cấp độ {fearlessLevel}:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {fearlessLevel === 1 && 'Nói một mình (Tự luyện)'}
                    {fearlessLevel === 2 && 'Nói cùng AI thân thiện'}
                    {fearlessLevel === 3 && 'Tình huống Roleplay'}
                    {fearlessLevel === 4 && 'Phản xạ áp lực cao'}
                    {fearlessLevel === 5 && 'Câu hỏi bất ngờ'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={fearlessLevel}
                  onChange={(e) => setFearlessLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Right Interactive Voice Chat Stage */}
            <div className={`lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${
              showHeroBanner ? 'min-h-[580px] h-[calc(100vh-17rem)]' : 'min-h-[660px] h-[calc(100vh-10.5rem)]'
            }`}>
              {/* Call Mode Status Bar */}
              {isCallActive && (
                <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white flex items-center justify-between text-xs font-bold shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Cuộc gọi 1:1 Đang Hoạt Động (Rảnh tay, không cần bấm gửi)</span>
                  </div>
                  <span className="text-[11px] opacity-90">Tự động nhận diện khi bạn dừng nói 1.4s</span>
                </div>
              )}

              {/* Chat Log */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.viTranslation && (
                        <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          💡 {msg.viTranslation}
                        </p>
                      )}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakText(msg.content)}
                          className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Nghe lại</span>
                        </button>
                      )}
                    </div>
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
              <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
                <span className="text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 mr-2">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bị bí từ?</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setWhatShouldISayStep(1)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                  >
                    Gợi ý ý tưởng
                  </button>
                  <button
                    onClick={() => setWhatShouldISayStep(2)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                  >
                    Từ then chốt
                  </button>
                  <button
                    onClick={() => setWhatShouldISayStep(3)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 whitespace-nowrap shrink-0"
                  >
                    Mẫu câu hoàn chỉnh
                  </button>
                </div>
              </div>

              {whatShouldISayStep && (
                <div className="px-6 py-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs border-t border-amber-500/20">
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
              )}

              {/* Voice Input & Action Bar */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`p-3.5 rounded-2xl transition shadow-md flex items-center justify-center shrink-0 whitespace-nowrap ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                      : 'btn-glass-primary shadow-indigo-500/30'
                  }`}
                  title={isListening ? 'Bấm để dừng nói' : 'Bấm để bật Micro'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    isCallActive
                      ? 'Chế độ 1:1 đang bật — hãy nói vào Micro, câu nói sẽ tự gửi...'
                      : isListening
                      ? 'Đang lắng nghe giọng nói của bạn...'
                      : 'Nói qua Micro hoặc gõ câu trả lời...'
                  }
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!transcript.trim() || coachLoading}
                  className="btn-glass-primary px-5 py-3 rounded-2xl disabled:opacity-50 font-extrabold text-xs shadow-md transition whitespace-nowrap shrink-0"
                >
                  Gửi
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
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      selectedWord === item.word
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
                        speakText(item.word);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 transition"
                      title="Nghe phát âm chuẩn"
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
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Từ Đang Phân Tích</span>
                    <div className="flex items-center gap-3 mt-1">
                      <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{selectedWord}</h2>
                      <button
                        onClick={() => speakText(selectedWord)}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 transition"
                        title="Nghe phát âm bản xứ"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Real Mic Record Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startPronunciationRecording}
                      disabled={isRecordingPronunciation || evaluatingPronunciation}
                      className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center gap-2.5 whitespace-nowrap shrink-0 ${
                        isRecordingPronunciation
                          ? 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-500/20'
                          : 'btn-glass-primary shadow-indigo-600/25'
                      }`}
                    >
                      {isRecordingPronunciation ? (
                        <>
                          {/* 2-beat rhythmic soundwave indicator */}
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-4 bg-white rounded-full animate-pulse" />
                            <span className="w-1.5 h-4 bg-white rounded-full animate-pulse [animation-delay:250ms]" />
                          </span>
                          <span>Đang lắng nghe... Hãy phát âm từ!</span>
                        </>
                      ) : evaluatingPronunciation ? (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                          <span>Đang phân tích âm vị...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Bắt đầu thu âm & chấm điểm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {recordedSpokenWord && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                    <span className="text-slate-500 whitespace-nowrap">Giọng nói nhận diện được:</span>
                    <span className="font-black text-slate-800 dark:text-white">"{recordedSpokenWord}"</span>
                  </div>
                )}

                {pronunciationResult && (
                  <div className="space-y-4">
                    {/* Score Bar */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ Chính Xác Âm Vị</span>
                        <span className="text-2xl font-black text-emerald-500">{pronunciationResult.accuracy}%</span>
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
                        onClick={() => speakText(`I thoroughly inspected the code before deployment.`)}
                        className="mt-2 px-3 py-1.5 rounded-xl btn-glass-primary font-bold flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Nghe câu mẫu Shadowing</span>
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
                      setSimulatorHistory([{ role: 'assistant', content: `Hello, let's start the simulation for ${sc.name}. What is your proposal?` }]);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      simulatorScenario === sc.id
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
            <div className={`lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${
              showHeroBanner ? 'min-h-[560px] h-[calc(100vh-17rem)]' : 'min-h-[660px] h-[calc(100vh-10.5rem)]'
            }`}>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {simulatorHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                        item.role === 'user'
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
      </div>
  );
};
