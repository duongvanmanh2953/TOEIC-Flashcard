import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CornerDownRight,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export interface CommentUser {
  id: string;
  displayName: string;
  avatar?: string | null;
  role?: string;
}

export interface CommentItem {
  id: string;
  userId: string;
  parentId?: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: string;
  deletedAt?: string | null;
  user: CommentUser;
  replies?: CommentItem[];
}

export interface CommunityCommentSectionProps {
  targetType: 'deck' | 'exam';
  targetId: string;
  initialCount?: number;
}

export const CommunityCommentSection: React.FC<CommunityCommentSectionProps> = ({
  targetType,
  targetId,
  initialCount = 0,
}) => {
  const { user, isGuest, promptLogin } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Replying state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Collapsed replies state
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const apiBase = targetType === 'deck' ? `/community/decks/${targetId}/comments` : `/exams/${targetId}/comments`;
  const commentActionBase = targetType === 'deck' ? '/community/comments' : '/exams/comments';

  const fetchComments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res: any = await api.get(apiBase);
      const data = res?.data?.data || res?.data || res;
      setComments(data?.comments || []);
      setTotalCount(data?.totalCount ?? data?.comments?.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchComments();
    }
  }, [targetId]);

  const handlePostRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user || isGuest) {
      promptLogin('Đăng nhập để tham gia bình luận và trao đổi kinh nghiệm');
      return;
    }

    const contentToPost = newCommentText.trim();
    setNewCommentText('');

    try {
      setSubmitting(true);
      const res: any = await api.post(apiBase, { content: contentToPost });
      const created = res?.data?.data || res?.data || res;

      if (created && created.id) {
        const normalized: CommentItem = {
          ...created,
          user: created.user || {
            id: user.id,
            displayName: user.displayName || 'Bạn',
            avatar: user.avatar,
            role: user.role,
          },
          replies: created.replies || [],
          replyCount: created.replyCount || 0,
          likeCount: created.likeCount || 0,
          isEdited: false,
          createdAt: created.createdAt || new Date().toISOString(),
        };
        setComments((prev) => [normalized, ...prev]);
        setTotalCount((c) => c + 1);
      }
      fetchComments(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đăng bình luận.');
      setNewCommentText(contentToPost);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    if (!user || isGuest) {
      promptLogin('Đăng nhập để gửi câu trả lời');
      return;
    }

    const textToReply = replyText.trim();
    setReplyText('');
    setReplyingToId(null);

    try {
      setSubmitting(true);
      const res: any = await api.post(apiBase, { content: textToReply, parentId });
      const created = res?.data?.data || res?.data || res;

      if (created && created.id) {
        const normalizedReply: CommentItem = {
          ...created,
          user: created.user || {
            id: user.id,
            displayName: user.displayName || 'Bạn',
            avatar: user.avatar,
            role: user.role,
          },
          replies: [],
          replyCount: 0,
          likeCount: 0,
          isEdited: false,
          createdAt: created.createdAt || new Date().toISOString(),
        };

        const insertReply = (list: CommentItem[]): CommentItem[] => {
          return list.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                replyCount: (item.replyCount || 0) + 1,
                replies: [...(item.replies || []), normalizedReply],
              };
            }
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: insertReply(item.replies),
              };
            }
            return item;
          });
        };

        setComments((prev) => insertReply(prev));
        setTotalCount((c) => c + 1);
      }
      fetchComments(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể gửi câu trả lời.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    const contentToSave = editText.trim();
    setEditingCommentId(null);
    setEditText('');

    // Optimistic local update
    const updateEdit = (list: CommentItem[]): CommentItem[] => {
      return list.map((item) => {
        if (item.id === commentId) {
          return { ...item, content: contentToSave, isEdited: true };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: updateEdit(item.replies) };
        }
        return item;
      });
    };
    setComments((prev) => updateEdit(prev));

    try {
      await api.patch(`${commentActionBase}/${commentId}`, { content: contentToSave });
      fetchComments(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể sửa bình luận.');
      fetchComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    // Optimistic local update
    const deleteItem = (list: CommentItem[]): CommentItem[] => {
      return list
        .filter((item) => {
          if (item.id === commentId && (!item.replies || item.replies.length === 0)) {
            return false;
          }
          return true;
        })
        .map((item) => {
          if (item.id === commentId) {
            return { ...item, content: '[Bình luận đã bị xóa]', deletedAt: new Date().toISOString() };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: deleteItem(item.replies) };
          }
          return item;
        });
    };
    setComments((prev) => deleteItem(prev));
    setTotalCount((c) => Math.max(0, c - 1));

    try {
      await api.delete(`${commentActionBase}/${commentId}`);
      fetchComments(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa bình luận.');
      fetchComments();
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderComment = (item: CommentItem, depth: number = 0) => {
    const isOwner = user?.id === item.userId;
    const isDeleted = Boolean(item.deletedAt);
    const hasReplies = item.replies && item.replies.length > 0;
    const isCollapsed = collapsedIds.has(item.id);
    const maxDepthReached = depth >= 2;

    return (
      <div
        key={item.id}
        className={`group relative space-y-2.5 ${
          depth > 0
            ? 'ml-4 sm:ml-8 pl-3 border-l-2 border-slate-200/80 dark:border-slate-800'
            : 'pt-3 border-t border-slate-100 dark:border-slate-800/80 first:border-t-0'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.user?.avatar ? (
              <img
                src={item.user.avatar}
                alt={item.user.displayName}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                {item.user?.displayName?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
              </div>
            )}

            <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                {item.user?.displayName || 'Thành viên'}
              </span>
              {item.user?.role === 'ADMIN' && (
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white">
                  Admin
                </span>
              )}
              <span className="text-[10px] text-slate-400">
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </span>
              {item.isEdited && (
                <span className="text-[9px] text-slate-400 italic">(Đã sửa)</span>
              )}
            </div>
          </div>

          {/* Action Menu for author */}
          {isOwner && !isDeleted && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                type="button"
                onClick={() => {
                  setEditingCommentId(item.id);
                  setEditText(item.content);
                }}
                className="p-1 rounded text-slate-400 hover:text-indigo-600"
                title="Chỉnh sửa"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(item.id)}
                className="p-1 rounded text-slate-400 hover:text-rose-600"
                title="Xóa"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {editingCommentId === item.id ? (
          <div className="space-y-2 pt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              rows={2}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCommentId(null)}
                className="text-xs text-slate-500 px-2 py-1"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(item.id)}
                className="btn-glass-primary text-xs !py-1 !px-3"
              >
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium ${
              isDeleted ? 'italic text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {item.content}
          </div>
        )}

        {/* Action Bar (Reply button, Collapse button) */}
        {!isDeleted && (
          <div className="flex items-center gap-3 pt-0.5 text-[11px] font-semibold text-slate-400">
            {!maxDepthReached && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === item.id ? null : item.id);
                  setReplyText('');
                }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Trả lời</span>
              </button>
            )}

            {hasReplies && (
              <button
                type="button"
                onClick={() => toggleCollapse(item.id)}
                className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5"
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                <span>
                  {isCollapsed ? `Xem ${item.replies?.length} câu trả lời` : 'Thu gọn'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Inline Reply Box */}
        {replyingToId === item.id && (
          <div className="pt-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Trả lời ${item.user?.displayName}...`}
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostReply(item.id);
                  }
                }}
              />
              <button
                type="button"
                disabled={submitting || !replyText.trim()}
                onClick={() => handlePostReply(item.id)}
                className="btn-glass-primary text-xs !py-1.5 !px-3 shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {hasReplies && !isCollapsed && (
          <div className="space-y-2.5 pt-2">
            {item.replies?.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span>Bình luận & Thảo luận ({totalCount})</span>
        </h4>
      </div>

      {/* Root Comment Form */}
      <form onSubmit={handlePostRootComment} className="flex items-center gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onClick={() => {
            if (!user || isGuest) {
              promptLogin('Đăng nhập để nhận xét và thảo luận về bộ đề');
            }
          }}
          placeholder={
            user && !isGuest
              ? 'Viết nhận xét, chia sẻ mẹo làm bài...'
              : 'Đăng nhập để nhận xét về bộ đề này...'
          }
          className="flex-1 text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !newCommentText.trim()}
          className="btn-glass-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          Đang tải bình luận...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 italic">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => renderComment(c, 0))}
        </div>
      )}
    </div>
  );
};
