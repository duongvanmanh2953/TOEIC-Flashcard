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
  UploadCloud,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  communityKnowledgeService,
  CommunityTopic,
} from '../../services/communityKnowledge.service';
import { useAuth } from '../../contexts/AuthContext';
import { CountryFlag } from '../../components/language/CountryFlag';
import { parseDocumentFile } from '../../utils/documentParser';

export const POST_LANGUAGES = [
  { code: 'en', name: 'Tiếng Anh (English)', country: 'gb' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', country: 'vn' },
  { code: 'ja', name: 'Tiếng Nhật (Japanese)', country: 'jp' },
  { code: 'ko', name: 'Tiếng Hàn (Korean)', country: 'kr' },
  { code: 'zh', name: 'Tiếng Trung (Chinese)', country: 'cn' },
  { code: 'de', name: 'Tiếng Đức (German)', country: 'de' },
  { code: 'fr', name: 'Tiếng Pháp (French)', country: 'fr' },
  { code: 'es', name: 'Tiếng Tây Ban Nha (Spanish)', country: 'es' },
];

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

  // Document Upload States
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [docImportSuccess, setDocImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    setDocImportSuccess(null);
    try {
      const parsed = await parseDocumentFile(file);
      if (!title.trim() && parsed.title) {
        setTitle(parsed.title);
      }
      if (content.trim()) {
        setContent((prev) => `${prev}\n\n${parsed.content}`);
      } else {
        setContent(parsed.content);
      }
      setDocImportSuccess(
        `Đã trích xuất nội dung từ file "${file.name}". Lưu ý: Toàn bộ ảnh đã được tự động bỏ qua theo tiêu chuẩn bài viết!`,
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi trích xuất tài liệu Word/PDF.');
    } finally {
      setIsParsingDoc(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      <div className="h-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto pb-16">
      {/* Hidden File Input for Word/PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf,.txt,.md"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 px-4 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Word / PDF Import Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingDoc}
              title="Nhập bài viết từ file Word (.docx) hoặc PDF (chỉ lấy văn bản, vứt bỏ ảnh)"
              className="btn-glass-secondary btn-glass-sm !px-3 font-bold"
            >
              {isParsingDoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="hidden sm:inline">{isParsingDoc ? 'Đang đọc...' : 'Tải lên Word/PDF'}</span>
            </button>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={previewMode ? 'btn-glass-primary btn-glass-sm !px-3 font-bold' : 'btn-glass-secondary btn-glass-sm !px-3 font-semibold'}
            >
              {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewMode ? 'Soạn thảo' : 'Xem trước'}</span>
            </button>

            {!isEditMode && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !title.trim()}
                className="btn-glass-secondary btn-glass-sm !px-3.5 font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="btn-glass-primary btn-glass-sm !px-4 font-bold"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isEditMode ? 'Lưu cập nhật' : 'Gửi duyệt bài'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 w-full">
        {/* Document Parse Notice */}
        {docImportSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{docImportSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setDocImportSuccess(null)}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

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
          {/* Metadata Row: Topic & Language with Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Chủ đề kiến thức</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="select-glass w-full !text-xs font-semibold"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ngôn ngữ bài viết đề cập</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  <CountryFlag languageId={language} size="xs" />
                  <span className="uppercase">{language}</span>
                </span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="select-glass w-full !text-xs font-bold"
              >
                {POST_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
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
