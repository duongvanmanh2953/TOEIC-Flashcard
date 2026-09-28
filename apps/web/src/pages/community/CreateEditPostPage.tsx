import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Send,
  Eye,
  Edit3,
  Tag,
  BookOpen,
  Globe,
  AlertTriangle,
  Loader2,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityTopic,
} from '../../services/communityKnowledge.service';
import { useAuth } from '../../contexts/AuthContext';

export const CreateEditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicId, setTopicId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [previewMode, setPreviewMode] = useState(false);
  const [initialStatus, setInitialStatus] = useState<string | null>(null);

  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    communityKnowledgeService.getTopics().then((res) => {
      setTopics(res);
      if (!isEditMode && res.length > 0) {
        setTopicId(res[0].id);
      }
    });

    if (isEditMode && id) {
      setIsLoading(true);
      communityKnowledgeService
        .getPostById(id)
        .then((post) => {
          setTitle(post.title);
          setContent(post.content || '');
          setTopicId(post.topic?.id || '');
          setTags(post.tags || []);
          setLanguage(post.language || 'en');
          setInitialStatus(post.status);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode]);

  const insertFormat = (before: string, after: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const previous = content.substring(0, start);
    const selected = content.substring(start, end);
    const following = content.substring(end);

    const replacement = `${before}${selected || 'văn bản'}${after}`;
    setContent(`${previous}${replacement}${following}`);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + (selected.length || 'văn bản'.length));
    }, 10);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await communityKnowledgeService.updatePost(id, {
          title: title.trim(),
          content,
          topicId: topicId || undefined,
          tags,
          language,
        });

        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: 'Cập nhật thành công',
              message:
                initialStatus === 'APPROVED'
                  ? 'Bài viết đã được cập nhật và chuyển sang trạng thái chờ ban quản trị duyệt lại.'
                  : 'Cập nhật bài viết thành công.',
            },
          }),
        );
        navigate('/community-knowledge/my-posts');
      } else {
        await communityKnowledgeService.createPost({
          title: title.trim(),
          content,
          topicId: topicId || undefined,
          tags,
          language,
          isDraft,
        });

        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: isDraft ? 'Đã lưu bản nháp' : 'Gửi bài thành công',
              message: isDraft
                ? 'Bài viết đã được lưu vào bản nháp của bạn.'
                : 'Bài viết đã gửi đến ban quản trị để kiểm duyệt trước khi hiển thị công khai.',
            },
          }),
        );
        navigate('/community-knowledge/my-posts');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                previewMode
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewMode ? 'Soạn thảo' : 'Xem trước'}</span>
            </button>

            {!isEditMode && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !title.trim()}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isEditMode ? 'Lưu cập nhật' : 'Gửi duyệt bài'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Re-moderation Warning Banner for Approved Posts */}
        {isEditMode && initialStatus === 'APPROVED' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Lưu ý kiểm duyệt bài viết đã xuất bản:</p>
              <p className="leading-relaxed opacity-90">
                Để đảm bảo chất lượng tri thức học thuật cho cộng đồng, khi bạn lưu chỉnh sửa, bài viết sẽ tạm thời chuyển sang trạng thái <strong>"Chờ duyệt lại"</strong> để ban quản trị kiểm tra trước khi tiếp tục hiển thị công khai.
              </p>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-6">
          {/* Metadata Row: Topic & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Chủ đề kiến thức</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ngôn ngữ diễn giải</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="en">Song ngữ Anh - Việt (Khuyên dùng)</option>
                <option value="en-only">100% English (Tiếng Anh toàn phần)</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tiêu đề bài viết <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Phân biệt thì Hiện Tại Hoàn Thành vs Quá Khứ Đơn trong đề thi TOEIC Part 5..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm sm:text-base font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Thẻ phân loại (Tags)</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag rồi ấn Enter (VD: toeic-part-5, phrasal-verbs)..."
                className="flex-1 text-xs bg-transparent text-slate-700 dark:text-slate-200 focus:outline-hidden min-w-[200px] px-1"
              />
            </div>
          </div>

          {/* Markdown Toolbar */}
          {!previewMode && (
            <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-50/70 dark:bg-slate-800/50 scrollbar-none">
              <button
                type="button"
                onClick={() => insertFormat('**', '**')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Đậm"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('*', '*')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Nghiêng"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('<u>', '</u>')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Gạch chân"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => insertFormat('# ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Tiêu đề 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('## ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Tiêu đề 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('### ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Tiêu đề 3"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => insertFormat('> ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Trích dẫn"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('`', '`')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Mã nguồn (Code inline)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('- ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Danh sách dấu chấm"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('1. ')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Danh sách số"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('[tên liên kết](', ')')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Chèn liên kết"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Content Textarea or Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nội dung bài viết (Hỗ trợ Markdown) <span className="text-rose-500">*</span>
            </label>
            {previewMode ? (
              <div className="min-h-[350px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {content || <span className="text-slate-400 italic">Chưa có nội dung để xem trước...</span>}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                rows={14}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Trình bày giải thích chi tiết, ví dụ câu, phân tích lỗi sai và lời khuyên học tập..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 transition leading-relaxed resize-y font-sans"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
