import React, { useState, useEffect } from 'react';
import {
  HelpCircle, X, AlertTriangle, Brain, Sparkles, 
  Clock, ArrowRight, Zap, Target, BookOpen, PenTool, 
  Mic, Eye, Loader2, CheckCircle2, RefreshCw, Lightbulb
} from 'lucide-react';
import api from '../../lib/api';

interface DiagnosticData {
  vocabulary: {
    id: string;
    word: string;
    meaningVi: string;
    phonetic?: string;
    partOfSpeech?: string;
  };
  scores: {
    recognition: number;
    recall: number;
    context: number;
    production: number;
    speaking: number;
  };
  memoryStatus: string;
  stability: number;
  retrievability: number;
  difficulty: number;
  lapseCount: number;
  reasons: string[];
  recommendedAction: string;
  journey: Array<{
    id: string;
    eventType: string;
    description: string;
    createdAt: string;
  }>;
  confusionPair?: {
    confusedWith: string;
    distinctionTip: string;
  } | null;
}

interface WordDiagnosticModalProps {
  vocabularyId: string | null;
  onClose: () => void;
}

export const WordDiagnosticModal: React.FC<WordDiagnosticModalProps> = ({
  vocabularyId,
  onClose,
}) => {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!vocabularyId) return;
    setLoading(true);
    setErrorMsg(null);
    api.get(`/vocabulary/${vocabularyId}/diagnostic`)
      .then((res: any) => {
        const payload = res?.data || res;
        setData(payload);
      })
      .catch((err) => {
        console.warn('Diagnostic error:', err);
        setErrorMsg('Không thể trích xuất chẩn đoán trí nhớ cho từ này.');
      })
      .finally(() => setLoading(false));
  }, [vocabularyId]);

  if (!vocabularyId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 text-slate-200 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Chẩn đoán: Tại sao tôi hay quên / dùng sai từ này?
              </h3>
              <p className="text-[11px] text-slate-400">
                VocabFlow™ Root-Cause Diagnostic & Word Journey Timeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto space-y-4 grow pr-1 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
              <p>Đang phân tích dữ liệu thần kinh học tập...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {errorMsg}
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Word Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{data.vocabulary.word}</span>
                    {data.vocabulary.phonetic && (
                      <span className="text-slate-400 font-mono text-xs">{data.vocabulary.phonetic}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                      {data.memoryStatus}
                    </span>
                  </div>
                  <p className="text-indigo-200 mt-1 font-semibold">{data.vocabulary.meaningVi}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Độ bền trí nhớ</div>
                  <div className="text-lg font-mono font-black text-emerald-400">{data.stability} ngày</div>
                </div>
              </div>

              {/* Diagnosis Root Causes */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Nguyên nhân cốt lõi khiến bạn gặp khó khăn:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90 pl-1 leading-relaxed">
                  {data.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div className="pt-1 text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span><strong>Hành động khắc phục:</strong> {data.recommendedAction}</span>
                </div>
              </div>

              {/* Confusion Pair Notice */}
              {data.confusionPair && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 space-y-1">
                  <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Hay bị nhầm lẫn với: "{data.confusionPair.confusedWith}"</span>
                  </div>
                  <p className="text-[11px] text-purple-200/90">
                    Mẹo phân biệt: {data.confusionPair.distinctionTip}
                  </p>
                </div>
              )}

              {/* 5-Dimensional Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Chỉ số thành thạo 5 chiều (0 - 100%)
                </h4>
                {[
                  { label: 'Nhận diện mặt chữ (Recognition)', val: data.scores.recognition, color: 'bg-blue-500' },
                  { label: 'Hồi tưởng ngữ nghĩa (Recall)', val: data.scores.recall, color: 'bg-indigo-500' },
                  { label: 'Ngữ cảnh sử dụng (Context)', val: data.scores.context, color: 'bg-emerald-500' },
                  { label: 'Tự đặt câu & viết (Production)', val: data.scores.production, color: 'bg-amber-500' },
                  { label: 'Phát âm tự nhiên (Speaking)', val: data.scores.speaking, color: 'bg-rose-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-mono font-bold text-white">{item.val}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Word Journey Timeline */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dòng thời gian gắn bó (Word Journey Timeline)</span>
                </h4>

                <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-3 py-1">
                  {data.journey && data.journey.length > 0 ? (
                    data.journey.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[17px] top-1.5" />
                        <div className="text-[11px] font-semibold text-slate-200">
                          {item.description}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500">
                      Từ này vừa được thêm vào lộ trình học tập của bạn.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
