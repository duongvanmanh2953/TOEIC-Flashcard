import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Eye,
  Edit3,
  Save,
  Trash2,
  Archive,
  Pin,
  Tag,
  Folder,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { NoteItem, NoteCategory } from '../../services/notes.service';

interface NoteEditorProps {
  note: NoteItem | null;
  categories: NoteCategory[];
  onSave: (data: {
    title: string;
    content: string;
    categoryId?: string | null;
    tags: string[];
    isPinned: boolean;
    isArchived: boolean;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  isSaving?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  onSave,
  onDelete,
  onRestore,
  isSaving = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when incoming note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setCategoryId(note.categoryId || null);
      setTags(note.tags || []);
      setIsPinned(note.isPinned || false);
      setIsArchived(note.isArchived || false);
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date(note.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } else {
      setTitle('');
      setContent('');
      setCategoryId(null);
      setTags([]);
      setIsPinned(false);
      setIsArchived(false);
      setHasUnsavedChanges(false);
      setLastSavedTime(null);
    }
  }, [note?.id]);

  // Debounced Auto-save after 2.5 seconds of inactivity
  useEffect(() => {
    if (!note || !hasUnsavedChanges) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (title.trim()) {
        await handleSave();
      }
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, categoryId, tags, isPinned, isArchived, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!title.trim()) return;
    await onSave({
      title: title.trim(),
      content,
      categoryId: categoryId || undefined,
      tags,
      isPinned,
      isArchived,
    });
    setHasUnsavedChanges(false);
    setLastSavedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  };

  const insertFormat = (before: string, after: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const previous = content.substring(0, start);
    const selected = content.substring(start, end);
    const following = content.substring(end);

    const replacement = `${before}${selected || 'văn bản'}${after}`;
    const nextContent = `${previous}${replacement}${following}`;

    setContent(nextContent);
    setHasUnsavedChanges(true);

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
        const nextTags = [...tags, clean];
        setTags(nextTags);
        setHasUnsavedChanges(true);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    setHasUnsavedChanges(true);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertFormat('**', '**');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertFormat('*', '*');
      } else if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-slate-800">
          <Edit3 className="w-8 h-8 text-indigo-500" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">Chọn hoặc tạo ghi chép</p>
          <p className="text-xs max-w-sm mt-1">
            Chọn một ghi chép từ danh sách bên trái hoặc nhấn nút "Thêm ghi chép mới" để bắt đầu lưu kiến thức.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryId || ''}
              onChange={(e) => {
                setCategoryId(e.target.value || null);
                setHasUnsavedChanges(true);
              }}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="">Chưa phân loại</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pin Button */}
          <button
            onClick={() => {
              setIsPinned(!isPinned);
              setHasUnsavedChanges(true);
            }}
            className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isPinned
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isPinned ? 'Đã ghim' : 'Ghim'}</span>
          </button>

          {/* Archive Button */}
          <button
            onClick={() => {
              setIsArchived(!isArchived);
              setHasUnsavedChanges(true);
            }}
            className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isArchived
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ ghi chép'}
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArchived ? 'Đã lưu trữ' : 'Lưu trữ'}</span>
          </button>
        </div>

        {/* Action Controls & Save Status */}
        <div className="flex items-center gap-2">
          {/* Status Label */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                <span>Đang lưu...</span>
              </>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-500 font-medium">Chưa lưu</span>
            ) : lastSavedTime ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> Đã lưu {lastSavedTime}
              </span>
            ) : null}
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              previewMode
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Chuyển chế độ xem trước"
          >
            {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Soạn thảo' : 'Xem trước'}</span>
          </button>

          {/* Manual Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition"
              title="Xóa ghi chép"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Formatting Toolbar (Only in Edit Mode) */}
      {!previewMode && (
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50 scrollbar-none">
          <button
            type="button"
            onClick={() => insertFormat('**', '**')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Đậm (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Nghiêng (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('<u>', '</u>')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Gạch chân"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('~~', '~~')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Gạch ngang"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('# ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Tiêu đề 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('## ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Tiêu đề 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('### ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Tiêu đề 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormat('> ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Trích dẫn"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('`', '`')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Mã nguồn (Code inline)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('- ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Danh sách dấu chấm"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('1. ')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Danh sách số"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('[tên liên kết](', ')')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Chèn liên kết"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Title & Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Tiêu đề ghi chép..."
          className="w-full text-xl sm:text-2xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden placeholder:text-slate-400"
        />

        {/* Tags Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
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
            placeholder="Thêm tag (nhấn Enter)..."
            className="text-xs bg-transparent text-slate-600 dark:text-slate-300 focus:outline-hidden placeholder:text-slate-400 py-0.5"
          />
        </div>

        {/* Content Pane: Editor vs Preview */}
        {previewMode ? (
          <div className="prose dark:prose-invert max-w-none pt-2 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {content || <span className="text-slate-400 italic">Chưa có nội dung ghi chép.</span>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Bắt đầu ghi chép nội dung kiến thức, từ vựng, ngữ pháp tại đây... (Hỗ trợ Markdown phong phú, Ctrl+B, Ctrl+I, Ctrl+S)"
            className="w-full min-h-[400px] h-[calc(100%-120px)] text-sm sm:text-base text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-hidden resize-none leading-relaxed font-sans"
          />
        )}
      </div>
    </div>
  );
};
