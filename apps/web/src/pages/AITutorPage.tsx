import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { useTranslation } from '../i18n';
import {
  Send,
  BrainCircuit,
  Bookmark,
  Plus,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface VocabularyCardData {
  word: string;
  cefrLevel: string;
  partOfSpeech?: string;
  definition: string;
  meaningVi: string;
  pronunciation?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vocabularyCard?: VocabularyCardData | null;
  createdAt: Date;
}

export const AITutorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialWord = searchParams.get('word') || '';
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedWord, setAddedWord] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Gia sư VocabFlow AI**. Tôi sẵn sàng giúp bạn phân tích sắc thái từ vựng, collocation thực tế, tạo câu ví dụ CEFR chuẩn xác hoặc giải đáp ngữ pháp. Bạn muốn khám phá từ vựng hay cấu trúc nào hôm nay?',
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

  const handleSendMessage = async (customPrompt?: string) => {
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

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.reply || 'Tôi đã xử lý câu hỏi của bạn.',
        vocabularyCard: data?.vocabularyCard || null,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Xin lỗi, không thể kết nối tới mô hình AI lúc này. Vui lòng thử lại sau giây lát.',
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

  const quickActions = [
    { label: t('aiTutor.quickExplain', 'Giải thích chuyên sâu'), prompt: 'Giải thích chi tiết các sắc thái nghĩa và ví dụ thực tế' },
    { label: t('aiTutor.quickQuiz', 'Đố tôi một câu'), prompt: 'Hãy tạo cho tôi 1 câu hỏi trắc nghiệm kiểm tra phản xạ từ vựng' },
    { label: t('aiTutor.quickExamples', 'Ví dụ môi trường làm việc'), prompt: 'Cho tôi 3 ví dụ câu giao tiếp chuyên nghiệp trong công việc' },
    { label: t('aiTutor.quickCompare', 'So sánh từ đồng nghĩa'), prompt: 'So sánh sự khác biệt sắc thái giữa các từ đồng nghĩa phổ biến' },
  ];

  return (
    <div className="w-full h-[calc(100vh-7rem)] md:h-[calc(100vh-6rem)] flex flex-col animate-fade-in min-h-0 overflow-hidden">
      {/* Header — Fixed at Top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {t('aiTutor.title', 'Gia Sư AI LexiMind')}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('aiTutor.subtitle', 'Chuyên gia ngôn ngữ theo ngữ cảnh chuẩn CEFR')}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content:
                  'Xin chào! Cuộc trò chuyện mới đã bắt đầu. Bạn muốn tìm hiểu hoặc luyện tập từ vựng nào?',
                createdAt: new Date(),
              },
            ])
          }
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/60 dark:border-slate-800/60"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('aiTutor.newChat', 'Cuộc trò chuyện mới')}</span>
        </button>
      </div>

      {/* Messages Feed — Flex-1 Scrollable Area (No Outer Scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                <BrainCircuit className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
              {/* Text Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-sm rounded-br-none font-medium'
                    : 'glass-panel text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
              </div>

              {/* Structured Vocabulary Card (if present) */}
              {msg.vocabularyCard && (
                <GlassCard className="p-4 border border-indigo-500/30 shadow-md space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                          {msg.vocabularyCard.word}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase border border-indigo-500/20">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition"
                    >
                      {addedWord === msg.vocabularyCard.word ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã lưu vào kho từ</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{t('aiTutor.addToWordBank', 'Lưu vào Kho từ cá nhân')}</span>
                        </>
                      )}
                    </button>
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
              <span>{t('aiTutor.thinking', 'AI is thinking...')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Fixed Area (Quick Actions + Composer) */}
      <div className="shrink-0 pt-2 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qa.prompt)}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-2xs"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Composer Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="glass-panel p-2 rounded-2xl flex items-center gap-2 border border-slate-200/80 dark:border-slate-800/80"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiTutor.inputPlaceholder', 'Hỏi bất kỳ điều gì: sắc thái từ, phrasal verbs...')}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-normal"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <span>{t('aiTutor.send', 'Gửi')}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
