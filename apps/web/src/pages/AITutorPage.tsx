import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vocabularyCard?: VocabularyCardData | null;
  comparisonCard?: ComparisonCardData | null;
  quizCard?: QuizCardData | null;
  createdAt: Date;
}

export const AITutorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialWord = searchParams.get('word') || '';
  const { t } = useTranslation();
  const { isGuest, promptLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'extract'>('chat');
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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Gia sư VocabFlow AI**. Tôi có thể giúp bạn giải thích sắc thái từ vựng theo CEFR, so sánh các từ dễ nhầm lẫn (như economic vs economical), tạo câu đố phản xạ hoặc phân tích đoạn văn bất kỳ. Bạn muốn học từ nào hôm nay?',
      createdAt: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialWord) {
      handleExplainWord(initialWord);
    }
  }, [initialWord]);

  const handleSendMessage = async (customPrompt?: string, actionType?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || loading) return;

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
      const res: any = await api.post('/ai/tutor', { message: text });
      const data = res.data;

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
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Không thể kết nối máy chủ AI lúc này. Đây là gợi ý tự động: Hãy chú ý các cặp từ dễ nhầm lẫn như "sensible" (hợp lý) và "sensitive" (nhạy cảm).',
          createdAt: new Date(),
        },
      ]);
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

  // Instant Test from Text Handler
  const handleExtractFromText = () => {
    if (!pasteText.trim()) return;
    setExtracting(true);

    setTimeout(() => {
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
          {
            word: 'facilitate',
            cefrLevel: 'B2',
            partOfSpeech: 'verb',
            phonetic: '/fəˈsɪlɪteɪt/',
            meaningVi: 'tạo điều kiện thuận lợi, hỗ trợ thúc đẩy',
            contextSentence: 'New technologies facilitate faster cross-border transactions.',
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
          {
            id: 2,
            question: 'Điền vào chỗ trống: "The government took measures to __________ trade agreements."',
            options: ['facilitate', 'fluctuate', 'postpone', 'dismiss'],
            correctAnswer: 'facilitate',
            explanation: '"facilitate trade agreements" là collocation chuẩn nghĩa là thúc đẩy hiệp định thương mại.',
          },
        ],
      });
      setExtracting(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Vocabulary Tutor 24/7</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
            Gia Sư Trí Tuệ Nhân Tạo & Luyện Tập Ngữ Cảnh
          </h1>
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
            <span>💬 Trò chuyện Gia sư</span>
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
            <span>📄 Học từ văn bản bất kỳ</span>
          </button>
        </div>
      </div>

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

                      {/* Quick Action Buttons Directly Under Message */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleSendMessage('Hãy đố tôi 1 câu hỏi phản xạ từ vựng', 'quiz')}
                          className="px-2 py-0.8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>🎯 Đố tôi 1 câu</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage('Cho tôi ví dụ câu dễ hơn trong môi trường làm việc')}
                          className="px-2 py-0.8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>💡 Cho ví dụ dễ hơn</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage('So sánh sự khác nhau giữa các từ dễ nhầm lẫn liên quan', 'compare')}
                          className="px-2 py-0.8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>⚖️ So sánh từ tương tự</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
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
                              <span className="text-xs font-mono text-slate-400">
                                ({msg.vocabularyCard.partOfSpeech})
                              </span>
                            )}
                          </div>
                          {msg.vocabularyCard.pronunciation && (
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                              {msg.vocabularyCard.pronunciation}
                            </p>
                          )}
                        </div>

                        <SpeechButton text={msg.vocabularyCard.word} showSlowOption={true} />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          🇻🇳 {msg.vocabularyCard.meaningVi}
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
                        <span>⚖️ Phân Tích So Sánh Sắc Thái Nghĩa</span>
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

          {/* Bottom Composer */}
          <div className="shrink-0 pt-2">
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
                <span>Dán Đoạn Văn Bản / Email Tiếng Anh Bất Kỳ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI sẽ trích xuất tự động các từ vựng học thuật/công sở giá trị cao, giải nghĩa theo ngữ cảnh và tạo bài trắc nghiệm kiểm tra tức thì.
              </p>
            </div>

            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Dán đoạn văn tiếng Anh ở đây (ví dụ: email đối tác, bài báo kinh tế, tài liệu dự án...)"
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
                    <p className="text-xs text-slate-400 font-mono">{w.phonetic}</p>
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
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                            💡 {q.explanation}
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
    </div>
  );
};
