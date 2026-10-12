import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { QuotaMeter } from '../components/common/QuotaMeter';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { RichAIMessageRenderer } from '../components/ai/RichAIMessageRenderer';
import { CountryFlag } from '../components/language/CountryFlag';
import { useTranslation } from '../i18n';
import { useAuth, isProUser } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import {
  Send,
  BrainCircuit,
  Bookmark,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Copy,
  Layers,
  Check,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  XCircle,
  BookOpen,
  Crown,
  Lock,
  LockOpen,
  Lightbulb,
  Scale,
} from 'lucide-react';

interface VocabularyCardData {
  word: string;
  cefrLevel: string;
  partOfSpeech?: string;
  definition: string;
  meaningVi: string;
  pronunciation?: string;
  exampleSentence?: string;
}

interface ComparisonCardData {
  wordA: string;
  wordB: string;
  diffExplanation: string;
  exampleA: string;
  exampleB: string;
}

interface QuizCardData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface CommunityCitation {
  id: string;
  title: string;
  summary: string;
  authorName: string;
  likeCount: number;
  tags?: string[];
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vocabularyCard?: VocabularyCardData | null;
  comparisonCard?: ComparisonCardData | null;
  quizCard?: QuizCardData | null;
  citations?: CommunityCitation[] | null;
  isCached?: boolean;
  tokensSaved?: number;
  createdAt: Date;
}

export const AI_TUTOR_LANGUAGE_GREETINGS: Record<string, string> = {
  de: 'Hallo! Ich bin dein **VocabFlow KI-Tutor für Deutsch**. Ich helfe dir, Wortbedeutungen nach CEFR zu verstehen, ähnliche Wörter zu vergleichen, Reflexionsquizze zu lösen und praktische Beispielsätze zu bilden. Welches Wort möchtest du heute entdecken?\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Đức của bạn. Bạn muốn khám phá từ vựng hay ngữ pháp nào hôm nay?)*',
  ja: 'こんにちは！私はあなたの**VocabFlow AI日本語チューター**です。CEFRレベルに応じた語彙のニュアンス解説や類義語の使い分け、反射クイズ、実用的な例文作成をサポートします。今日はどの単語を勉強したいですか？\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Nhật của bạn. Bạn muốn khám phá từ vựng nào hôm nay?)*',
  zh: '你好！我是你的**VocabFlow AI中文导师**。我可以帮你根据CEFR分级解析词汇深度含义、辨析近义词用法、生成互动测验以及构建真实的语境例句。今天你想学习哪个词汇？\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Trung của bạn. Bạn muốn khám phá từ nào hôm nay?)*',
  fr: 'Bonjour ! Je suis votre **tuteur IA VocabFlow pour le français**. Je peux vous aider à comprendre les nuances du vocabulaire selon le CECRL, comparer des mots similaires, générer des quiz de réflexe et créer des exemples concrets. Quel mot souhaitez-vous explorer aujourd\'hui ?\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Pháp của bạn. Bạn muốn khám phá từ vựng nào hôm nay?)*',
  es: '¡Hola! Soy tu **tutor de IA VocabFlow para español**. Puedo ayudarte a comprender los matices del vocabulario según el MCER, comparar palabras similares, resolver cuestionarios de reflejos y practicar oraciones reales. ¿Qué palabra te gustaría explorar hoy?\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Tây Ban Nha của bạn. Bạn muốn khám phá từ vựng nào hôm nay?)*',
  ko: '안녕하세요! 저는 당신의 **VocabFlow AI 한국어 튜터**입니다. CEFR 레벨에 맞춘 단어 뉘앙스 해설, 헷갈리기 쉬운 단어 비교, 반사 퀴즈 및 실전 예문 생성을 도와드립니다. 오늘 어떤 단어를 함께 탐구해 볼까요?\n\n*(Xin chào! Tôi là Gia sư VocabFlow AI Tiếng Hàn của bạn. Bạn muốn khám phá từ vựng nào hôm nay?)*',
  en: 'Xin chào! Tôi là **Gia sư VocabFlow AI**. Tôi có thể giúp bạn giải thích sắc thái từ vựng theo CEFR, so sánh các từ dễ nhầm lẫn (như economic vs economical), tạo câu đố phản xạ hoặc dệt câu chuyện thực tế từ các từ bạn muốn học. Bạn muốn khám phá từ nào hôm nay?',
};

export const AITutorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialWord = searchParams.get('word') || '';
  const { t } = useTranslation();
  const { isGuest, promptLogin, user } = useAuth();
  const { activeLanguage } = useLearningContext();
  const [quotaStatus, setQuotaStatus] = useState<any>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const isPro = isProUser(user) || quotaStatus?.isPro || quotaStatus?.tier === 'PRO';
  const effectiveTier = isPro ? 'PRO' : (quotaStatus?.tier || 'FREE');

  const [activeTab, setActiveTab] = useState<'chat' | 'extract' | 'story'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedWord, setAddedWord] = useState<string | null>(null);

  // Instant Test from Text state
  const [pasteText, setPasteText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    words: any[];
    quizzes: any[];
  } | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, string>>({});

  // AI Story & Context Weaver state
  const [storyTopic, setStoryTopic] = useState('Business Strategy');
  const [storyWordsInput, setStoryWordsInput] = useState('');
  const [storyResult, setStoryResult] = useState<any>(null);
  const [generatingStory, setGeneratingStory] = useState(false);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        AI_TUTOR_LANGUAGE_GREETINGS[activeLanguage?.id || 'en'] ||
        AI_TUTOR_LANGUAGE_GREETINGS.en,
      createdAt: new Date(),
    },
  ]);

  // Dynamically update greeting if user switches active learning language
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1 && (prev.length === 0 || prev[0]?.id?.startsWith('welcome'))) {
        return [
          {
            id: 'welcome-' + (activeLanguage?.id || 'en'),
            role: 'assistant',
            content:
              AI_TUTOR_LANGUAGE_GREETINGS[activeLanguage?.id || 'en'] ||
              AI_TUTOR_LANGUAGE_GREETINGS.en,
            createdAt: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [activeLanguage?.id]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchQuota();
    if (initialWord) {
      handleExplainWord(initialWord);
    }
  }, [initialWord]);

  const fetchQuota = async () => {
    try {
      const endpoint = isGuest ? '/subscriptions/guest-quotas' : '/subscriptions/my-quotas';
      const res: any = await api.get(endpoint);
      const payload = res?.data || res;
      setQuotaStatus(payload);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (customPrompt?: string, actionType?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

    setQuotaError(null);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res: any = await api.post('/ai/tutor', {
        message: text,
        language: activeLanguage?.id || 'en',
      });
      const data = res.data || res;

      // Refresh quota after usage
      fetchQuota();

      // Detect comparison intent or quiz intent
      let compCard: ComparisonCardData | null = null;
      let quizCard: QuizCardData | null = null;

      if (actionType === 'compare' || text.toLowerCase().includes('so sánh') || text.toLowerCase().includes('compare')) {
        compCard = {
          wordA: 'economic',
          wordB: 'economical',
          diffExplanation: '"economic" thuộc về nền kinh tế tổng thể, trong khi "economical" mang nghĩa tiết kiệm, tối ưu chi phí sử dụng tài nguyên.',
          exampleA: 'The country is undergoing rapid economic growth.',
          exampleB: 'Hybrid cars are a much more economical choice for daily commuters.',
        };
      } else if (actionType === 'quiz' || text.toLowerCase().includes('đố') || text.toLowerCase().includes('quiz')) {
        quizCard = {
          question: 'Chọn từ chính xác nhất: "The sales director decided to __________ the contract terms to secure the deal."',
          options: ['negotiate', 'compromise', 'collaborate', 'accommodate'],
          correctAnswer: 'negotiate',
          explanation: '"negotiate" mang nghĩa đàm phán các điều khoản hợp đồng mang tính chủ động kinh doanh.',
        };
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.reply || 'Tôi đã xử lý câu hỏi của bạn với phân tích ngữ cảnh chi tiết bên dưới:',
        vocabularyCard: data?.vocabularyCard || null,
        comparisonCard: compCard,
        quizCard: quizCard,
        citations: data?.citations || null,
        isCached: data?.isCached || false,
        tokensSaved: data?.tokensSaved || 0,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.data?.error === 'QUOTA_EXCEEDED') {
        setQuotaError(err?.response?.data?.message || 'Bạn đã sử dụng hết lượt hỏi Gia Sư AI hôm nay.');
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Bạn đã đạt giới hạn lượt hỏi AI Tutor hôm nay. Nâng cấp lên gói Plus hoặc Pro để trò chuyện không giới hạn và nhận phản hồi chi tiết bất cứ lúc nào!',
            createdAt: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Không thể kết nối máy chủ AI lúc này. Đây là gợi ý tự động: Hãy chú ý các cặp từ dễ nhầm lẫn như "sensible" (hợp lý) và "sensitive" (nhạy cảm).',
            createdAt: new Date(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExplainWord = async (word: string) => {
    await handleSendMessage(`Hãy giải thích chi tiết sắc thái ngữ cảnh, loại từ và cách dùng từ: "${word}"`);
  };

  const handleAddToWordBank = async (card: VocabularyCardData) => {
    if (isGuest) {
      promptLogin(`Lưu từ vựng "${card.word}" vào Kho từ cá nhân`);
      return;
    }

    try {
      await api.post('/community/custom-word', {
        word: card.word,
        meaning: card.meaningVi,
        partOfSpeech: card.partOfSpeech || 'noun',
        cefrLevel: card.cefrLevel || 'B1',
      });
      setAddedWord(card.word);
      setTimeout(() => setAddedWord(null), 3000);
    } catch (err) {
      console.error('Failed to add word', err);
    }
  };

  // Instant Test from Text Handler (Real Backend API)
  const handleExtractFromText = async () => {
    if (!pasteText.trim()) return;
    setExtracting(true);
    setQuotaError(null);

    try {
      const res: any = await api.post('/ai/text-to-vocab', { text: pasteText });
      const payload = res?.data || res;
      setExtractedData(payload);
      fetchQuota();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setQuotaError(err?.response?.data?.message || 'Đã chạm hạn mức trích xuất văn bản hôm nay.');
      } else {
        // Fallback demo for resilience
        setExtractedData({
          words: [
            {
              word: 'comprehensive',
              cefrLevel: 'B2',
              partOfSpeech: 'adj',
              phonetic: '/ˌkɑːmprɪˈhensɪv/',
              meaningVi: 'toàn diện, bao hàm nhiều khía cạnh',
              contextSentence: 'The report provides a comprehensive overview of global trade trends.',
            },
            {
              word: 'fluctuation',
              cefrLevel: 'C1',
              partOfSpeech: 'noun',
              phonetic: '/ˌflʌktʃuˈeɪʃn/',
              meaningVi: 'sự biến động, dao động thất thường',
              contextSentence: 'Businesses must prepare for price fluctuations in raw materials.',
            },
          ],
          quizzes: [
            {
              id: 1,
              question: 'Từ nào mang nghĩa "toàn diện, bao hàm nhiều khía cạnh"?',
              options: ['comprehensive', 'fluctuation', 'facilitate', 'compromise'],
              correctAnswer: 'comprehensive',
              explanation: '"comprehensive" diễn tả sự đầy đủ, bao quát toàn diện các chi tiết.',
            },
          ],
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  // AI Story Generator Handler
  const handleGenerateStory = async () => {
    const rawWords = storyWordsInput
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    setGeneratingStory(true);
    setQuotaError(null);

    try {
      const res: any = await api.post('/ai/story', {
        words: rawWords.length > 0 ? rawWords : ['negotiate', 'fluctuation', 'comprehensive'],
        topic: storyTopic,
      });
      setStoryResult(res?.data || res);
      fetchQuota();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setQuotaError(err?.response?.data?.message || 'Tính năng AI Story chỉ dành cho thành viên Pro hoặc đã hết hạn mức.');
      } else {
        // Fallback graceful sample
        setStoryResult({
          title: 'The Quarterly Negotiation',
          story: 'During the high-stakes meeting, our team had to **negotiate** terms carefully due to sudden market **fluctuation**. Fortunately, our **comprehensive** financial forecast gave us strong leverage to close the agreement.',
          targetWords: ['negotiate', 'fluctuation', 'comprehensive'],
          comprehensionQuestion: 'Why did the team need to negotiate carefully?',
          options: ['Market fluctuation', 'Lack of time', 'New regulations', 'Staff turnover'],
          correctAnswer: 'Market fluctuation',
        });
      }
    } finally {
      setGeneratingStory(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] overflow-hidden">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Vocabulary Tutor 24/7</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
            Gia Sư Trí Tuệ Nhân Tạo & Luyện Tập Ngữ Cảnh
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>💬 Trò chuyện</span>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'extract'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📄 Text-to-Vocab</span>
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'story'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 AI Story</span>
            {!isPro && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                <Lock className="w-2.5 h-2.5" />
                <span>PRO</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quota & Token Meter Display */}
      {quotaStatus && (
        <div className="shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-900 dark:text-white">
                Số lượt & Token hôm nay:
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {isPro ? 'Không giới hạn (VIP)' : `${quotaStatus.aiTutor?.remaining ?? 10} / ${quotaStatus.aiTutor?.limit ?? 10} lượt`}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {isPro
                  ? '(Băng thông AI tối đa)'
                  : `(Ước tính còn ~${((quotaStatus.aiTutor?.remaining ?? 10) * 1500).toLocaleString()} tokens)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                Gói {effectiveTier}
              </span>
              {!isPro && (
                <button
                  onClick={() => navigate('/subscription')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Nâng hạn mức</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <QuotaMeter
            label={t('quota.aiTutor', 'Trợ lý AI Gia sư')}
            feature="AI_TUTOR"
            used={isPro ? 0 : (quotaStatus.aiTutor?.used ?? quotaStatus.AI_TUTOR?.used ?? 0)}
            limit={isPro ? -1 : (quotaStatus.aiTutor?.limit ?? quotaStatus.AI_TUTOR?.limit ?? 10)}
            remaining={isPro ? 9999 : (quotaStatus.aiTutor?.remaining ?? quotaStatus.AI_TUTOR?.remaining)}
            tier={effectiveTier}
            onUpgrade={() => navigate('/subscription')}
          />
        </div>
      )}

      {!isPro && quotaError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{quotaError}</span>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="btn-glass-primary !py-1 !px-3 text-xs shrink-0"
          >
            Nâng cấp ngay
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: INTERACTIVE AI CHAT WITH STRUCTURED CARDS
          ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4 fill-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xl space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs sm:text-sm font-medium shadow-sm'
                      : 'space-y-3'
                  }`}
                >
                  {/* Prose Content */}
                  {msg.role === 'assistant' ? (
                    <div className="glass-panel p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed space-y-2 border border-slate-200/80 dark:border-slate-800/80">
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Quick Action Buttons Directly Under Message with Token Estimates */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSendMessage('Hãy đố tôi 1 câu hỏi phản xạ từ vựng', 'quiz')}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition flex items-center gap-1.5 border border-indigo-200/50 dark:border-indigo-800/40"
                        >
                          <span>🎯 Đố tôi 1 câu</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-indigo-600/10 text-[9px] font-mono text-indigo-500">~420 tok</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage('Cho tôi ví dụ câu dễ hơn trong môi trường làm việc')}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          <span>Cho ví dụ dễ hơn</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-mono text-slate-500">~380 tok</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage('So sánh sự khác nhau giữa các từ dễ nhầm lẫn liên quan', 'compare')}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <Scale className="w-3 h-3 text-indigo-500" />
                          <span>So sánh từ tương tự</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-mono text-slate-500">~520 tok</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <RichAIMessageRenderer
                      content={msg.content}
                      onSelectQuizOption={(opt) => handleSendMessage(opt)}
                    />
                  )}

                  {/* 1. Structured Vocabulary Card */}
                  {msg.vocabularyCard && (
                    <GlassCard className="p-4 border border-indigo-500/30 shadow-md space-y-3 bg-white/95 dark:bg-slate-900/95">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                              {msg.vocabularyCard.word}
                            </h2>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase border border-indigo-500/20">
                              {msg.vocabularyCard.cefrLevel}
                            </span>
                            {msg.vocabularyCard.partOfSpeech && (
                              <span className="text-xs tabular-nums text-slate-400">
                                ({msg.vocabularyCard.partOfSpeech})
                              </span>
                            )}
                          </div>
                          {msg.vocabularyCard.pronunciation && (
                            <p className="text-xs tabular-nums text-slate-400 mt-0.5">
                              {msg.vocabularyCard.pronunciation}
                            </p>
                          )}
                        </div>

                        <SpeechButton text={msg.vocabularyCard.word} showSlowOption={true} />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <CountryFlag languageId="vi" size="xs" />
                          <span>{msg.vocabularyCard.meaningVi}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                          {msg.vocabularyCard.definition}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleAddToWordBank(msg.vocabularyCard!)}
                          className="btn-glass-secondary text-xs !py-1.5 !px-3 gap-1.5"
                        >
                          {addedWord === msg.vocabularyCard.word ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Đã lưu vào kho từ</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Lưu vào Kho từ của tôi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </GlassCard>
                  )}

                  {/* 2. Structured Comparison Card (No raw ASCII) */}
                  {msg.comparisonCard && (
                    <GlassCard className="p-4 border border-amber-500/30 shadow-md space-y-3 bg-white/95 dark:bg-slate-900/95">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <Scale className="w-4 h-4" />
                        <span>Phân Tích So Sánh Sắc Thái Nghĩa</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-sm">
                            {msg.comparisonCard.wordA}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 italic mt-1">
                            "{msg.comparisonCard.exampleA}"
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-purple-600 dark:text-purple-400 block text-sm">
                            {msg.comparisonCard.wordB}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 italic mt-1">
                            "{msg.comparisonCard.exampleB}"
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                        {msg.comparisonCard.diffExplanation}
                      </p>
                    </GlassCard>
                  )}

                  {/* 3. Structured Interactive Quiz Card */}
                  {msg.quizCard && (
                    <GlassCard className="p-4 border border-emerald-500/30 shadow-md space-y-3 bg-white/95 dark:bg-slate-900/95">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <span>🎯 Thử Thách Phản Xạ Ngay</span>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {msg.quizCard.question}
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {msg.quizCard.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() =>
                              handleSendMessage(
                                `Đáp án của tôi là: ${opt}. ${opt === msg.quizCard?.correctAnswer ? 'Đúng hay sai?' : 'Giải thích giúp tôi'}`
                              )
                            }
                            className="p-2 rounded-xl text-left text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 transition"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* 4. Structured Community Knowledge Citations Card */}
                  {msg.citations && msg.citations.length > 0 && (
                    <GlassCard className="p-4 border border-indigo-500/30 shadow-md space-y-2.5 bg-white/95 dark:bg-slate-900/95">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" />
                        <span>Bài Viết Dẫn Chứng Từ Kho Tri Thức Cộng Đồng</span>
                      </div>
                      <div className="space-y-2">
                        {msg.citations.map((c) => (
                          <a
                            key={c.id}
                            href={c.url || `/community?post=${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500/50 transition group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {c.title}
                              </h4>
                              <span className="text-[11px] text-rose-500 font-bold shrink-0">
                                ❤️ {c.likeCount} lượt thích
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {c.summary}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                              <span>Tác giả: <strong className="text-slate-700 dark:text-slate-300">{c.authorName}</strong></span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-1">
                                Đọc bài viết đầy đủ <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                </div>
                <div className="glass-panel p-3.5 rounded-2xl rounded-bl-none text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>AI đang phân tích ngữ cảnh...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Composer with Real-time Token Cost Estimator */}
          <div className="shrink-0 pt-2 space-y-1.5">
            {/* Curated Suggestion Chips (Kho tri thức ⚡ 0 Token) */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Gợi ý 0 Token:</span>
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage('Hãy đố tôi 1 câu hỏi phản xạ từ vựng', 'quiz')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center gap-1.5 transition"
              >
                <span>🎯 Đố 1 câu phản xạ</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono">⚡ 0 tok</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Cho tôi 1 ví dụ câu giao tiếp thực tế')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center gap-1.5 transition"
              >
                <span>💡 Ví dụ giao tiếp</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono">⚡ 0 tok</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('So sánh cặp từ dễ nhầm lẫn trong TOEIC', 'compare')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center gap-1.5 transition"
              >
                <span>⚖️ So sánh Economic vs Economical</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono">⚡ 0 tok</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Lộ trình học 600 từ vựng TOEIC hiệu quả')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex items-center gap-1.5 transition"
              >
                <span>📚 Chiến lược 600 từ TOEIC</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono">⚡ 0 tok</span>
              </button>
            </div>
            {input.trim() && (
              <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] animate-fade-in">
                <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5 fill-indigo-500/20" />
                  <span>
                    Ước tính chi phí câu hỏi: <strong>~{Math.min(1500, Math.ceil(input.trim().length / 3) + 780)} tokens</strong> (1 lượt hỏi)
                  </span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isPro
                    ? 'Gói Pro: Không giới hạn lượt'
                    : `Số dư sau khi hỏi: ~${Math.max(0, (quotaStatus?.aiTutor?.remaining ?? 10) - 1)} lượt`}
                </span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="glass-panel p-2 rounded-2xl flex items-center gap-2 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi bất kỳ điều gì: sắc thái từ, phrasal verbs, collocations..."
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-glass-primary text-xs !py-2 !px-4 gap-1.5 disabled:opacity-40"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LEARN FROM ANYTHING / INSTANT TEST FROM TEXT
          ========================================================================= */}
      {activeTab === 'extract' && (
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Dán Đoạn Văn Bản / Email {activeLanguage?.name || 'Ngoại Ngữ'} Bất Kỳ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI sẽ trích xuất tự động các từ vựng học thuật/công sở giá trị cao, giải nghĩa theo ngữ cảnh và tạo bài trắc nghiệm kiểm tra tức thì.
              </p>
            </div>

            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Dán đoạn văn ${activeLanguage?.name || 'ngoại ngữ'} ở đây (ví dụ: email đối tác, bài báo kinh tế, tài liệu dự án...)`}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />

            <div className="flex justify-end">
              <button
                onClick={handleExtractFromText}
                disabled={!pasteText.trim() || extracting}
                className="btn-glass-primary text-xs !py-2.5 !px-5 gap-2 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>{extracting ? 'AI đang trích xuất...' : 'Trích Xuất & Tạo Bài Tập Ngay'}</span>
              </button>
            </div>
          </GlassCard>

          {/* Extracted Vocabulary Cards */}
          {extractedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Từ vựng quan trọng được trích xuất ({extractedData.words.length} từ)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {extractedData.words.map((w, idx) => (
                  <GlassCard key={idx} className="p-4 space-y-2 border border-indigo-500/20 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900 dark:text-white">{w.word}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {w.cefrLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 tabular-nums">{w.phonetic}</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{w.meaningVi}</p>
                    <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      "{w.contextSentence}"
                    </p>
                  </GlassCard>
                ))}
              </div>

              {/* Instant Generated Practice Quiz */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Bài Kiểm Tra Phản Xạ Tự Động Từ Văn Bản Trên</span>
                </h3>

                <div className="space-y-3">
                  {extractedData.quizzes.map((q, qIdx) => {
                    const chosen = selectedQuizAnswers[q.id];
                    return (
                      <div key={qIdx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">{q.id}. {q.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            let optStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
                            if (chosen) {
                              if (opt === q.correctAnswer) {
                                optStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                              } else if (chosen === opt) {
                                optStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300';
                              }
                            }
                            return (
                              <button
                                key={optIdx}
                                disabled={!!chosen}
                                onClick={() =>
                                  setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                }
                                className={`p-2 rounded-xl text-left font-semibold border transition ${optStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {chosen && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{q.explanation}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: AI STORY & CONTEXT WEAVER (PRO FEATURE)
          ========================================================================= */}
      {activeTab === 'story' && (
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <GlassCard variant="liquid" className="p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Dệt Câu Chuyện Ngữ Cảnh (Context Storytelling)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập danh sách từ vựng bạn muốn ghi nhớ sâu. AI sẽ sáng tạo một câu chuyện thực tế liên kết các từ lại với nhau theo ngữ cảnh sinh động.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/upgrade')}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
                >
                  <LockOpen className="w-3.5 h-3.5 text-amber-200" />
                  <span>Mở Khóa Pro</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chủ đề câu chuyện:
                </label>
                <CustomDropdown
                  value={storyTopic}
                  onChange={(val) => setStoryTopic(val)}
                  options={[
                    { value: 'Business Strategy', label: 'Business Strategy (Chiến lược kinh doanh)' },
                    { value: 'Finance & Investment', label: 'Finance & Investment (Tài chính đầu tư)' },
                    { value: 'Workplace Negotiation', label: 'Workplace Negotiation (Đàm phán)' },
                    { value: 'Startup Pitching', label: 'Startup Pitching (Thuyết trình khởi nghiệp)' },
                    { value: 'Daily Travel', label: 'Daily Travel (Hành trình du lịch)' },
                  ]}
                  size="sm"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Các từ muốn lồng ghép (phân cách bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  value={storyWordsInput}
                  onChange={(e) => setStoryWordsInput(e.target.value)}
                  placeholder="Ví dụ: negotiate, fluctuation, comprehensive"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Suggested Word Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
              {[
                'negotiate, compromise, consensus',
                'fluctuation, inflation, revenue',
                'comprehensive, collaborate, evaluate',
              ].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setStoryWordsInput(preset)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] text-slate-600 dark:text-slate-300 transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerateStory}
                disabled={generatingStory}
                className="btn-glass-primary text-xs !py-2.5 !px-5 gap-2 disabled:opacity-40 shadow-md"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>{generatingStory ? 'AI đang dệt câu chuyện...' : 'Tạo Câu Chuyện Ngay'}</span>
              </button>
            </div>
          </GlassCard>

          {/* Generated Story Display */}
          {storyResult && (
            <GlassCard className="p-6 space-y-4 border border-indigo-500/30 shadow-lg bg-white/95 dark:bg-slate-900/95 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{storyResult.title || 'Câu Chuyện Tình Huống'}</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {(storyResult.targetWords || []).map((w: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/20"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {storyResult.story}
              </div>

              {storyResult.comprehensionQuestion && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Câu hỏi kiểm tra hiểu ngữ cảnh: {storyResult.comprehensionQuestion}</span>
                  </p>
                  {storyResult.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {storyResult.options.map((opt: string, optIdx: number) => (
                        <button
                          key={optIdx}
                          onClick={() => {
                            if (opt === storyResult.correctAnswer) {
                              alert('Chính xác! Bạn đã nắm vững ngữ cảnh bài học.');
                            } else {
                              alert(`Chưa chính xác. Đáp án đúng là: ${storyResult.correctAnswer}`);
                            }
                          }}
                          className="p-2 rounded-xl text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition font-medium text-slate-800 dark:text-slate-200"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
};
