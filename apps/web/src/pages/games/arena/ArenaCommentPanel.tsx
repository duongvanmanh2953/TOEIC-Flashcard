import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Heart, Gift, MessageSquare, Flame, Sparkles } from 'lucide-react';

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
}

export const ArenaCommentPanel: React.FC<ArenaCommentPanelProps> = ({
  comments = [],
  totalCommenters = 0,
  isConnected = true,
  onSendComment,
  className = '',
  showAnnouncementTicker = true,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'top'>('chat');
  const [inputText, setInputText] = useState('');
  const [likeCount, setLikeCount] = useState(1240);
  const [hasLiked, setHasLiked] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mock comments matching reference if comment stream is sparse
  const displayComments: ArenaCommentItem[] = comments.length > 0
    ? comments
    : [
        {
          eventId: '1',
          username: 'nguyen_van_a',
          displayName: 'Nguyễn Văn A',
          commentText: 'Paris',
          timestamp: Date.now() - 5000,
          isCorrect: true,
          scoreAdded: 10,
        },
        {
          eventId: '2',
          username: 'gamemaster',
          displayName: 'GameMaster',
          commentText: 'Paris',
          timestamp: Date.now() - 4000,
          isCorrect: true,
          scoreAdded: 10,
        },
        {
          eventId: '3',
          username: 'haminh',
          displayName: 'Hà Minh',
          commentText: 'Đúng rồi! 👏',
          timestamp: Date.now() - 3500,
        },
        {
          eventId: '4',
          username: 'user123',
          displayName: 'User123',
          commentText: 'Paris',
          timestamp: Date.now() - 3000,
          isCorrect: true,
          scoreAdded: 10,
        },
        {
          eventId: '5',
          username: 'tranthib',
          displayName: 'Trần Thị B',
          commentText: 'Tuyệt vời! ❤️',
          timestamp: Date.now() - 2500,
        },
        {
          eventId: '6',
          username: 'ducanh',
          displayName: 'DucAnh',
          commentText: 'Paris',
          timestamp: Date.now() - 2000,
          isCorrect: true,
          scoreAdded: 10,
        },
        {
          eventId: '7',
          username: 'maiphuong',
          displayName: 'Mai Phương',
          commentText: 'Cố lên mọi người! 💪',
          timestamp: Date.now() - 1000,
        },
      ];

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !onSendComment) return;
    onSendComment(clean);
    setInputText('');
  };

  const handleLike = () => {
    setLikeCount((prev) => prev + 1);
    setHasLiked(true);
  };

  return (
    <div
      className={`flex flex-col h-full rounded-3xl bg-slate-900/85 border border-indigo-500/30 shadow-2xl backdrop-blur-2xl overflow-hidden ${className}`}
    >
      {/* 1. Header Tabs: Trò chuyện & 🔥 Top Comment */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Trò chuyện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('top')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'top'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Top Comment</span>
          </button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10"
      >
        {displayComments.map((item, idx) => (
          <div
            key={item.eventId || idx}
            className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition"
          >
            {/* User Info & Message */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    item.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username || idx}`
                  }
                  alt={item.displayName}
                  className="w-8 h-8 rounded-full border border-indigo-400/40 object-cover bg-slate-800"
                />
              </div>

              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-200 block truncate">
                  {item.displayName}
                </span>
                <span className="text-xs text-white font-medium block truncate">
                  {item.commentText}
                </span>
              </div>
            </div>

            {/* +10 ⭐ Reward Badge (as seen in user image) */}
            {item.isCorrect && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-black text-[11px] shrink-0 flex items-center gap-1 shadow-sm">
                <span>+10</span>
                <span>⭐</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 3. Bottom Controls: Input + Announcement Ticker & Actions */}
      <div className="p-3 border-t border-white/10 bg-slate-950/60 space-y-2.5 shrink-0">
        {/* Ticker Banner & Quick Action Buttons */}
        {showAnnouncementTicker && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-slate-200 text-[11px] truncate flex-1">
              <span className="shrink-0">📢</span>
              <span className="truncate font-semibold text-slate-300">
                Cùng tham gia trả lời và chinh phục bảng vàng nhé! 🔥
              </span>
            </div>

            {/* 🎁 Gift Button */}
            <button
              type="button"
              className="p-1.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-105 transition text-white shadow-md cursor-pointer shrink-0"
              title="Tặng quà cổ vũ"
            >
              <Gift className="w-4 h-4 text-amber-300" />
            </button>

            {/* ❤️ Likes Counter Button */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-black transition cursor-pointer shrink-0 ${
                hasLiked
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/30 scale-105'
                  : 'bg-slate-900/80 border-white/15 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'text-rose-400 fill-rose-400' : 'text-rose-400'}`} />
              <span>{(likeCount / 1000).toFixed(1)}K</span>
            </button>
          </div>
        )}

        {/* Comment Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập bình luận..."
            className="w-full py-2.5 pl-4 pr-12 rounded-full text-xs sm:text-sm bg-slate-900 border border-white/20 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 text-white placeholder-slate-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white transition cursor-pointer shadow-md"
            title="Gửi bình luận"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
