import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Bookmark,
  BookmarkCheck,
  Send,
  Trash2,
  CornerDownRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityPostItem,
  CommunityCommentItem,
} from '../../services/communityKnowledge.service';
import { useAuth } from '../../contexts/AuthContext';
import { RichContentRenderer } from '../../components/community/RichContentRenderer';
import {
  NoteSelectableContent,
  TextSelectionNoteToolbar,
} from '../../components/notes/TextSelectionNoteToolbar';

export const CommunityPostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, promptLogin } = useAuth();

  const [post, setPost] = useState<CommunityPostItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Nested replies map: commentId -> { items: [], hasMore: false, isLoading: false, isExpanded: false }
  const [repliesMap, setRepliesMap] = useState<
    Record<
      string,
      {
        items: CommunityCommentItem[];
        nextCursor: string | null;
        hasMore: boolean;
        isLoading: boolean;
        isExpanded: boolean;
      }
    >
  >({});
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyBoxId, setActiveReplyBoxId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsError(false);

    Promise.all([
      communityKnowledgeService.getPostById(id),
      communityKnowledgeService.getComments(id),
    ])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setComments(commentsData.items);
      })
      .catch((err) => {
        console.error(err);
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // Reactions
  const handleToggleReaction = async (targetType: 'LIKE' | 'DISLIKE') => {
    if (!post) return;
    if (!user) {
      promptLogin('Đăng nhập để tương tác bài viết');
      return;
    }

    const newType = post.userReaction === targetType ? 'NONE' : targetType;

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (newType === 'NONE') {
      if (post.userReaction === 'LIKE') likeDelta = -1;
      if (post.userReaction === 'DISLIKE') dislikeDelta = -1;
    } else if (newType === 'LIKE') {
      likeDelta = 1;
      if (post.userReaction === 'DISLIKE') dislikeDelta = -1;
    } else {
      dislikeDelta = 1;
      if (post.userReaction === 'LIKE') likeDelta = -1;
    }

    setPost({
      ...post,
      userReaction: newType === 'NONE' ? null : newType,
      likeCount: Math.max(0, post.likeCount + likeDelta),
      dislikeCount: Math.max(0, post.dislikeCount + dislikeDelta),
    });

    try {
      const res = await communityKnowledgeService.handleReaction(post.id, newType);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likeCount: res.likeCount,
              dislikeCount: res.dislikeCount,
              userReaction: res.userReaction,
            }
          : prev,
      );
    } catch {
      // Refresh post
      if (id) communityKnowledgeService.getPostById(id).then(setPost);
    }
  };

  // Save / Bookmark
  const handleToggleSave = async () => {
    if (!post) return;
    if (!user) {
      promptLogin('Đăng nhập để lưu bài viết');
      return;
    }

    const nextSaved = !post.isSaved;
    setPost({
      ...post,
      isSaved: nextSaved,
      saveCount: Math.max(0, post.saveCount + (nextSaved ? 1 : -1)),
    });

    try {
      await communityKnowledgeService.toggleSave(post.id, nextSaved);
    } catch {
      if (id) communityKnowledgeService.getPostById(id).then(setPost);
    }
  };

  // Share
  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;

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

  // Post Root Comment
  const handlePostRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newCommentText.trim() || isPostingComment) return;

    if (!user) {
      promptLogin('Đăng nhập để bình luận bài viết');
      return;
    }

    setIsPostingComment(true);
    try {
      const created = await communityKnowledgeService.createComment(post.id, {
        content: newCommentText.trim(),
      });

      setComments((prev) => [created, ...prev]);
      setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Load Nested Replies on-demand
  const handleToggleReplies = async (commentId: string) => {
    const existing = repliesMap[commentId];

    if (existing?.isExpanded) {
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: { ...prev[commentId], isExpanded: false },
      }));
      return;
    }

    if (existing?.items?.length) {
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: { ...prev[commentId], isExpanded: true },
      }));
      return;
    }

    // Fetch replies for this comment
    setRepliesMap((prev) => ({
      ...prev,
      [commentId]: {
        items: [],
        nextCursor: null,
        hasMore: false,
        isLoading: true,
        isExpanded: true,
      },
    }));

    try {
      const res = await communityKnowledgeService.getReplies(commentId);
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: {
          items: res.items,
          nextCursor: res.nextCursor,
          hasMore: res.hasMore,
          isLoading: false,
          isExpanded: true,
        },
      }));
    } catch {
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: {
          items: [],
          nextCursor: null,
          hasMore: false,
          isLoading: false,
          isExpanded: false,
        },
      }));
    }
  };

  // Post Reply
  const handlePostReply = async (parentCommentId: string) => {
    const text = (replyInputMap[parentCommentId] || '').trim();
    if (!post || !text) return;

    if (!user) {
      promptLogin('Đăng nhập để trả lời bình luận');
      return;
    }

    try {
      const reply = await communityKnowledgeService.createComment(post.id, {
        content: text,
        parentId: parentCommentId,
      });

      setRepliesMap((prev) => {
        const current = prev[parentCommentId] || { items: [], nextCursor: null, hasMore: false };
        return {
          ...prev,
          [parentCommentId]: {
            ...current,
            items: [...current.items, reply],
            isExpanded: true,
            isLoading: false,
          },
        };
      });

      // Update parent comment replyCount
      setComments((prev) =>
        prev.map((c) => (c.id === parentCommentId ? { ...c, replyCount: c.replyCount + 1 } : c)),
      );
      setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev));
      setReplyInputMap((prev) => ({ ...prev, [parentCommentId]: '' }));
      setActiveReplyBoxId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await communityKnowledgeService.deleteComment(commentId);

      if (parentId) {
        setRepliesMap((prev) => {
          const current = prev[parentId];
          if (!current) return prev;
          return {
            ...prev,
            [parentId]: {
              ...current,
              items: current.items.filter((item) => item.id !== commentId),
            },
          };
        });
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }

      setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bài viết không tồn tại hoặc đã bị gỡ</h2>
        <button
          onClick={() => navigate('/community-knowledge')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Quay lại bảng tin cộng đồng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/community-knowledge')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bảng tin</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
              title="Chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-xl transition ${
                post.isSaved
                  ? 'text-amber-500 fill-current bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={post.isSaved ? 'Đã lưu' : 'Lưu bài viết'}
            >
              {post.isSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Main Post Article Card */}
        <article className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-6">
          {/* Author & Topic */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                  {post.author.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {post.author.displayName}
                  </span>
                  {post.author.role === 'ADMIN' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black border border-purple-500/30">
                      <ShieldCheck className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span>•</span>
                  <span>{post.viewCount} lượt xem</span>
                </div>
              </div>
            </div>

            {post.topic && (
              <span
                className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                style={{
                  backgroundColor: `${post.topic.color}15`,
                  color: post.topic.color,
                  border: `1px solid ${post.topic.color}35`,
                }}
              >
                {post.topic.name}
              </span>
            )}
          </div>

          {/* Selectable Post Content for Quick Notes */}
          <NoteSelectableContent
            sourceType="community_post"
            sourceId={post.id}
            sourceTitle={post.title}
            className="space-y-4"
          >
            {/* Title */}
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Full Academic Rich Content */}
            <RichContentRenderer content={post.content} />
          </NoteSelectableContent>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Interaction Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleReaction('LIKE')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition text-xs font-bold ${
                  post.userReaction === 'LIKE'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${post.userReaction === 'LIKE' ? 'fill-current' : ''}`} />
                <span>{post.likeCount} Thích</span>
              </button>

              <button
                onClick={() => handleToggleReaction('DISLIKE')}
                className={`p-2 rounded-2xl transition text-xs font-bold ${
                  post.userReaction === 'DISLIKE'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Không thích"
              >
                <ThumbsDown className={`w-4 h-4 ${post.userReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>

              <button
                onClick={handleToggleSave}
                className={`px-3.5 py-2 rounded-2xl transition text-xs font-bold flex items-center gap-1.5 ${
                  post.isSaved
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {post.isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                <span>{post.isSaved ? 'Đã lưu' : 'Lưu bài'}</span>
              </button>
            </div>
          </div>
        </article>

        {/* Multi-Level Comments Section */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Bình luận & Thảo luận ({post.commentCount})
            </h2>
          </div>

          {/* Root Comment Form */}
          <form onSubmit={handlePostRootComment} className="space-y-3">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Viết nhận xét, thắc mắc hoặc bổ sung ví dụ thực tế..."
              rows={3}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 transition resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newCommentText.trim() || isPostingComment}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {isPostingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Gửi bình luận</span>
              </button>
            </div>
          </form>

          {/* Root Comments List */}
          <div className="space-y-4 pt-2">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Chưa có bình luận nào. Hãy là người đầu tiên trao đổi về bài viết này!
              </p>
            ) : (
              comments.map((comment) => {
                const replies = repliesMap[comment.id];
                const isReplyBoxOpen = activeReplyBoxId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3"
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {comment.author.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.displayName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                            {comment.author.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {comment.author.displayName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {user && (user.id === comment.author.id || user.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Xóa bình luận"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-9">
                      {comment.content}
                    </p>

                    {/* Footer Actions: Reply Button & View Replies */}
                    <div className="flex items-center gap-3 pl-9 pt-1 text-xs">
                      <button
                        onClick={() => setActiveReplyBoxId(isReplyBoxOpen ? null : comment.id)}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {isReplyBoxOpen ? 'Đóng' : 'Trả lời'}
                      </button>

                      {comment.replyCount > 0 && (
                        <button
                          onClick={() => handleToggleReplies(comment.id)}
                          className="font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          {replies?.isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          <span>{replies?.isExpanded ? 'Ẩn' : `Xem ${comment.replyCount} phản hồi`}</span>
                        </button>
                      )}
                    </div>

                    {/* Reply Input Box */}
                    {isReplyBoxOpen && (
                      <div className="pl-9 pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={replyInputMap[comment.id] || ''}
                          onChange={(e) =>
                            setReplyInputMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
                          }
                          placeholder={`Trả lời ${comment.author.displayName}...`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handlePostReply(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Gửi</span>
                        </button>
                      </div>
                    )}

                    {/* Nested Replies Rendering (Capped & Scaled for Mobile) */}
                    {replies?.isExpanded && (
                      <div className="pl-6 sm:pl-9 pt-3 space-y-3 border-l-2 border-indigo-500/20 ml-4 mt-2">
                        {replies.isLoading ? (
                          <div className="py-2 text-xs text-indigo-500 flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải câu trả lời...</span>
                          </div>
                        ) : (
                          replies.items.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                    {reply.author.displayName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                {user && (user.id === reply.author.id || user.role === 'ADMIN') && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id, comment.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Floating Note Selection Action Toolbar */}
      <TextSelectionNoteToolbar />
    </div>
  );
};
