import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Heart, Flame, Sparkles, MessageSquare, Trophy, Crown, CheckCircle2 } from 'lucide-react';
import { PlayerAvatar } from '@vocabflow/shared';

export interface ArenaCommentItem {
  eventId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  commentText: string;
  parsedOption?: string;
  timestamp: number;
  isCorrect?: boolean;
  scoreAdded?: number;
  totalScore?: number;
  provider?: string;
}

interface ArenaCommentPanelProps {
  comments: ArenaCommentItem[];
  totalCommenters?: number;
  isConnected?: boolean;
  onSendComment?: (text: string) => void;
  className?: string;
  showAnnouncementTicker?: boolean;
  showInput?: boolean;
  embedded?: boolean;
}

export const ArenaCommentPanel: React.FC<ArenaCommentPanelProps> = ({
  comments = [],
  totalCommenters = 0,
  isConnected = true,
  onSendComment,
  className = '',
  showAnnouncementTicker = true,
  showInput = true,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'top'>('chat');
  const [inputText, setInputText] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // The feed is newest-first. Keep readers browsing older comments in place.
  useEffect(() => {
    const feed = scrollContainerRef.current;
    if (activeTab === 'chat' && feed && feed.scrollTop < 24) feed.scrollTop = 0;
  }, [comments, activeTab]);

  // Authoritative Top Comments: Filter comments with correct answers or highest score added
  const topComments = useMemo(() => {
    const correctOnes = comments.filter((c) => c.isCorrect || (c.scoreAdded && c.scoreAdded > 0));
    if (correctOnes.length > 0) {
      return [...correctOnes].sort((a, b) => {
        const scoreDiff = (b.scoreAdded || 0) - (a.scoreAdded || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.timestamp - b.timestamp; // Fastest first
      });
    }
    // If no one answered correctly yet, show comments that made an answer attempt
    const attempts = comments.filter((c) => Boolean(c.parsedOption));
    return attempts.length > 0 ? attempts : [];
  }, [comments]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !isConnected || !onSendComment) return;
    onSendComment(clean);
    setInputText('');
  };

  const handleLike = () => {
    setLikeCount((prev) => prev + 1);
    setHasLiked(true);
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${embedded ? '' : 'rounded-2xl border border-indigo-400/25 bg-[#181531]'} ${className}`}
    >
      {/* 1. Header Tabs: Trò chuyện & 🔥 Top Comment */}
      <div className="p-2.5 sm:p-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 w-full">
          <button
            type="button"
            aria-pressed={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={`min-h-11 min-w-0 flex-1 px-1 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-950'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Trò chuyện</span>
            {comments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
                {comments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'top'}
            onClick={() => setActiveTab('top')}
            className={`min-h-11 min-w-0 flex-1 px-1 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'top'
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-950'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Top Comment</span>
            {topComments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400/30 text-amber-200 text-[10px] font-mono font-bold">
                {topComments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Comment View or Live Chat View */}
      {activeTab === 'top' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10">
          {topComments.length === 0 ? (
            <div className="text-center py-5 px-3 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-300">Chưa có Top Comment nào trong vòng này</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Bình luận đưa ra đáp án chính xác và nhanh nhất sẽ được vinh danh tại đây! ⭐
              </p>
            </div>
          ) : (
            topComments.map((item, idx) => (
              <div
                key={item.eventId || idx}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-500/20 via-purple-900/20 to-slate-900/80 border-amber-400/70 shadow-lg shadow-amber-500/10'
                    : idx === 1
                    ? 'bg-slate-900/90 border-slate-400/50'
                    : idx === 2
                    ? 'bg-slate-900/90 border-amber-700/50'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    {idx === 0 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                        🥇
                      </span>
                    ) : idx === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                        🥈
                      </span>
                    ) : idx === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                        🥉
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <PlayerAvatar
                    avatarUrl={item.avatarUrl}
                    displayName={item.displayName || item.username}
                    size="sm"
                  />

                  {/* Name and Content */}
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block truncate">
                      {item.displayName}
                    </span>
                    <span className="text-xs text-amber-200 font-medium block truncate">
                      {item.commentText}
                    </span>
                  </div>
                </div>

                {/* Score Pill */}
                {item.isCorrect && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 font-mono font-black text-xs shrink-0 flex items-center gap-1 shadow-sm">
                    <span>+{item.scoreAdded || 10}</span>
                    <span>⭐</span>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Live Chat Stream */
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10"
        >
          {comments.length === 0 ? (
            <div className="text-center py-5 px-3 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-300">Chưa có bình luận nào</p>
              <p className="text-[11px] text-slate-500">
                {showInput ? 'Gửi bình luận để thử luồng Live.' : 'Bình luận từ TikTok sẽ xuất hiện tại đây.'}
              </p>
            </div>
          ) : (
            comments.map((item, idx) => (
              <div
                key={item.eventId || idx}
                className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <PlayerAvatar
                    avatarUrl={item.avatarUrl}
                    displayName={item.displayName || item.username}
                    size="xs"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-300 truncate">
                        {item.displayName}
                      </span>
                      {(item.totalScore !== undefined && item.totalScore > 0) ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-bold text-[9px] shrink-0" title="Điểm trong phiên">
                          <Trophy className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>{item.totalScore.toLocaleString()}đ</span>
                        </span>
                      ) : (item.scoreAdded !== undefined && item.scoreAdded > 0) ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-bold text-[9px] shrink-0" title="Điểm trong phiên">
                          <Trophy className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>{item.scoreAdded.toLocaleString()}đ</span>
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-white font-medium block truncate">
                      {item.commentText}
                    </span>
                  </div>
                </div>

                {item.isCorrect && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-black text-[11px] shrink-0 flex items-center gap-1 shadow-sm">
                    <span>+{item.scoreAdded || 10}</span>
                    <span>⭐</span>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Input Footer & Reactions (Hidden in TikTok Live Mode or when showInput=false) */}
      {showInput ? (
        <div className="p-2.5 sm:p-3 border-t border-white/10 bg-slate-950/70 shrink-0 space-y-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập bình luận..."
              aria-label="Nhập bình luận"
              disabled={!isConnected}
              className="min-h-11 min-w-0 flex-1 px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />

            <button
              type="submit"
              disabled={!isConnected || !inputText.trim()}
              className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition cursor-pointer shrink-0 shadow-md"
              title="Gửi bình luận"
            >
              <Send className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLike}
              className={`min-h-11 min-w-11 justify-center rounded-lg border transition flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0 ${
                hasLiked
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-rose-400'
              }`}
              title="Thả tim cổ vũ"
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {likeCount > 0 && <span className="font-mono text-[10px]">{likeCount}</span>}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-2.5 sm:p-3 border-t border-white/10 bg-slate-950/70 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="truncate font-medium text-[11px] text-slate-300">
              {isConnected ? 'Bình luận từ Livestream TikTok' : 'Đang kết nối lại'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLike}
            className={`min-h-11 px-3 rounded-lg border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 ${
              hasLiked
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-rose-400'
            }`}
            title="Thả tim cổ vũ"
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="font-mono text-[11px]">{likeCount > 0 ? likeCount : 'Thả tim'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
