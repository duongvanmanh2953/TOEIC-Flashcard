import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Flame,
  Clock,
  Filter,
  ArrowUpDown,
  BookOpen,
  Award,
  AlertTriangle,
  Mic,
  GraduationCap,
  Library,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityPostItem,
  CommunityTopic,
} from '../../services/communityKnowledge.service';
import { VirtualScrollList } from '../../components/common/VirtualScrollList';
import { useAuth } from '../../contexts/AuthContext';
import { FilterSelect } from '../../components/ui/FilterSelect';

export const CommunityKnowledgeFeedPage: React.FC = () => {
  const { user, promptLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State: Topics
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    searchParams.get('topic') || '',
  );

  // State: Search & Filters
  const [keyword, setKeyword] = useState<string>(searchParams.get('q') || '');
  const [selectedTag, setSelectedTag] = useState<string | null>(searchParams.get('tag') || null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending' | 'most_discussed' | 'most_saved'>(
    (searchParams.get('sort') as any) || 'latest',
  );

  // State: Feed Posts & Cursor Pagination
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  // Search debounce ref & request sequence to eliminate race conditions
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeReqId = useRef(0);

  // 1. Fetch Topics
  useEffect(() => {
    communityKnowledgeService.getTopics().then(setTopics).catch(console.error);
  }, []);

  // 2. Fetch Feed Posts
  const fetchFeed = useCallback(
    async (isInitial = true, cursorToUse?: string) => {
      const currentReq = ++activeReqId.current;

      if (isInitial) {
        setIsLoadingInitial(true);
        setIsError(false);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await communityKnowledgeService.getFeed({
          topicId: selectedTopicId || undefined,
          tag: selectedTag || undefined,
          search: keyword.trim() || undefined,
          sortBy,
          limit: 20,
          cursor: cursorToUse,
        });

        if (currentReq !== activeReqId.current) return;

        if (isInitial) {
          setPosts(res.items);
        } else {
          setPosts((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            const newOnes = res.items.filter((p) => !existing.has(p.id));
            return [...prev, ...newOnes];
          });
        }

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (err) {
        if (currentReq === activeReqId.current) {
          setIsError(true);
        }
      } finally {
        if (currentReq === activeReqId.current) {
          setIsLoadingInitial(false);
          setIsLoadingMore(false);
        }
      }
    },
    [selectedTopicId, selectedTag, keyword, sortBy],
  );

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      fetchFeed(true);
    }, 350);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [selectedTopicId, selectedTag, keyword, sortBy]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchFeed(false, nextCursor);
    }
  };

  // 3. Interactions: Atomic Reactions
  const handleToggleReaction = async (
    postId: string,
    targetType: 'LIKE' | 'DISLIKE',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!user) {
      promptLogin('Đăng nhập để tương tác bài viết');
      return;
    }

    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const newType = currentPost.userReaction === targetType ? 'NONE' : targetType;

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        let likeDelta = 0;
        let dislikeDelta = 0;

        if (newType === 'NONE') {
          if (p.userReaction === 'LIKE') likeDelta = -1;
          if (p.userReaction === 'DISLIKE') dislikeDelta = -1;
        } else if (newType === 'LIKE') {
          likeDelta = 1;
          if (p.userReaction === 'DISLIKE') dislikeDelta = -1;
        } else {
          dislikeDelta = 1;
          if (p.userReaction === 'LIKE') likeDelta = -1;
        }

        return {
          ...p,
          userReaction: newType === 'NONE' ? null : newType,
          likeCount: Math.max(0, p.likeCount + likeDelta),
          dislikeCount: Math.max(0, p.dislikeCount + dislikeDelta),
        };
      }),
    );

    try {
      const res = await communityKnowledgeService.handleReaction(postId, newType);
      // Synchronize with backend authoritative counter
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likeCount: res.likeCount, dislikeCount: res.dislikeCount, userReaction: res.userReaction }
            : p,
        ),
      );
    } catch {
      // Rollback on network failure
      fetchFeed(true);
    }
  };

  // 4. Interactions: Toggle Bookmark / Save
  const handleToggleSave = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      promptLogin('Đăng nhập để lưu bài viết vào kho cá nhân');
      return;
    }

    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const nextSaved = !currentPost.isSaved;

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isSaved: nextSaved,
              saveCount: Math.max(0, p.saveCount + (nextSaved ? 1 : -1)),
            }
          : p,
      ),
    );

    try {
      await communityKnowledgeService.toggleSave(postId, nextSaved);
    } catch {
      fetchFeed(true);
    }
  };

  // 5. Interactions: Share Post
  const handleShare = async (post: CommunityPostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community-knowledge/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary || post.title,
          url,
        });
        await communityKnowledgeService.trackShare(post.id, 'NATIVE');
        return;
      } catch (_) {}
    }

    // Fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_TOAST', {
          detail: {
            type: 'success',
            title: 'Đã sao chép liên kết',
            message: 'Đã sao chép link bài viết vào clipboard.',
          },
        }),
      );
      await communityKnowledgeService.trackShare(post.id, 'LINK');
    } catch (_) {}
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
                Tri thức tiếng Anh
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" /> Cộng đồng sôi nổi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
              Community Knowledge Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Nơi giao lưu, giải thích ngữ pháp chuyên sâu, chia sẻ mẹo làm bài thi TOEIC & từ vựng tiếng Anh học thuật được kiểm duyệt.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                if (!user) {
                  promptLogin('Đăng nhập để xem các bài viết bạn đã lưu');
                  return;
                }
                navigate('/community-knowledge/saved');
              }}
              className="btn-glass-secondary btn-glass-sm font-bold"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Đã lưu</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  promptLogin('Đăng nhập để xem danh sách bài viết của bạn');
                  return;
                }
                navigate('/community-knowledge/my-posts');
              }}
              className="btn-glass-secondary btn-glass-sm font-bold"
            >
              <User className="w-3.5 h-3.5" />
              <span>Bài của tôi</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  promptLogin('Đăng nhập để chia sẻ bài viết kiến thức mới');
                  return;
                }
                navigate('/community-knowledge/new');
              }}
              className="btn-glass-primary btn-glass-sm font-bold shadow-md shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng bài mới</span>
            </button>
          </div>
        </div>
      {/* Main Container: Topic Filter Bar & Feed */}
      <div className="space-y-5">
        {/* 1. Horizontal Topic Tabs Carousel */}
        <div className="tab-pill-container self-start overflow-x-auto pb-1 scrollbar-none flex-nowrap max-w-full">
          <button
            onClick={() => setSelectedTopicId('')}
            className={`tab-pill ${!selectedTopicId ? 'tab-pill-active' : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tất cả chủ đề</span>
          </button>

          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopicId(t.id)}
              className={`tab-pill ${selectedTopicId === t.id ? 'tab-pill-active' : ''}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: t.color || '#6366f1' }}
              />
              <span>{t.name}</span>
              {t.postCount > 0 && (
                <span className="tab-pill-badge">
                  {t.postCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 2. Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm kiến thức, ngữ pháp, TOEIC Part 5, collocations..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <FilterSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              icon={ArrowUpDown}
              options={[
                { value: 'latest', label: 'Mới nhất' },
                { value: 'popular', label: 'Nhiều lượt thích nhất' },
                { value: 'trending', label: 'Thịnh hành (Trending)' },
                { value: 'most_discussed', label: 'Thảo luận nhiều nhất' },
                { value: 'most_saved', label: 'Lưu nhiều nhất' },
              ]}
              size="sm"
            />

            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                #{selectedTag}
                <button onClick={() => setSelectedTag(null)} className="font-bold ml-1">
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* 3. Virtualized Knowledge Feed (Infinite Scroll + Windowing) */}
        <div className="flex-1 min-h-[500px]">
          <VirtualScrollList<CommunityPostItem>
            items={posts}
            itemKey={(item) => item.id}
            estimatedItemHeight={195}
            hasMore={hasMore}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            isError={isError}
            onLoadMore={handleLoadMore}
            onRetry={() => fetchFeed(true)}
            containerClassName="h-[calc(100vh-280px)] px-1"
            contentClassName="pb-4"
            renderItem={(item) => (
              <article
                onClick={() => navigate(`/community-knowledge/${item.id}`)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer space-y-3 mb-3 group"
              >
                {/* Card Header: Author & Topic */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.author.avatar ? (
                      <img
                        src={item.author.avatar}
                        alt={item.author.displayName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {item.author.displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {item.author.displayName}
                        </span>
                        {item.author.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-black border border-purple-500/30">
                            <ShieldCheck className="w-2.5 h-2.5" /> ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {item.topic && (
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${item.topic.color}15`,
                        color: item.topic.color,
                        border: `1px solid ${item.topic.color}35`,
                      }}
                    >
                      {item.topic.name}
                    </span>
                  )}
                </div>

                {/* Card Body: Title & Plain-text Summary Preview */}
                <div className="space-y-1">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.summary || 'Không có mô tả ngắn...'}
                  </p>
                </div>

                {/* Tags Bar */}
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(t);
                        }}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Footer: Reaction Bar, Comments, Share, Save */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleReaction(item.id, 'LIKE', e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl transition ${
                        item.userReaction === 'LIKE'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${item.userReaction === 'LIKE' ? 'fill-current' : ''}`} />
                      <span>{item.likeCount}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleReaction(item.id, 'DISLIKE', e)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl transition ${
                        item.userReaction === 'DISLIKE'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${item.userReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
                    </button>

                    {/* Comment Count */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{item.commentCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(item, e)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Chia sẻ liên kết"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(item.id, e)}
                      className={`p-1.5 rounded-xl transition ${
                        item.isSaved
                          ? 'text-amber-500 fill-current bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={item.isSaved ? 'Đã lưu' : 'Lưu bài viết'}
                    >
                      {item.isSaved ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )}
          />
        </div>
      </div>
    </div>
  );
};
