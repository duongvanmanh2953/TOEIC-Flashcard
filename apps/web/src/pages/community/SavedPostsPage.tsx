import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityPostItem,
} from '../../services/communityKnowledge.service';
import { VirtualScrollList } from '../../components/common/VirtualScrollList';

export const SavedPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchSavedPosts = useCallback(async (isInitial = true, cursorToUse?: string) => {
    if (isInitial) setIsLoadingInitial(true);
    else setIsLoadingMore(true);

    try {
      const res = await communityKnowledgeService.getSavedPosts(cursorToUse, 20);

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
      console.error(err);
    } finally {
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPosts(true);
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchSavedPosts(false, nextCursor);
    }
  };

  const handleUnsave = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await communityKnowledgeService.toggleSave(postId, false);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <button
            onClick={() => navigate('/community-knowledge')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bảng tin</span>
          </button>
        </div>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-amber-500 fill-current" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Bài viết đã lưu
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Danh sách các bài viết tri thức cộng đồng bạn đã đánh dấu để ôn tập lại.
          </p>
        </div>

        {/* Virtualized Saved List */}
        <div className="min-h-[400px]">
          <VirtualScrollList<CommunityPostItem>
            items={posts}
            itemKey={(item) => item.id}
            estimatedItemHeight={175}
            hasMore={hasMore}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            onRetry={() => fetchSavedPosts(true)}
            containerClassName="h-[calc(100vh-250px)]"
            contentClassName="pb-4"
            renderItem={(item) => (
              <div
                onClick={() => navigate(`/community-knowledge/${item.id}`)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 cursor-pointer hover:border-indigo-500/50 transition mb-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.author.displayName}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleUnsave(item.id, e)}
                    className="p-1.5 rounded-xl text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Bỏ lưu"
                  >
                    <BookmarkCheck className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {item.summary || 'Không có mô tả ngắn...'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> {item.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {item.commentCount}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};
