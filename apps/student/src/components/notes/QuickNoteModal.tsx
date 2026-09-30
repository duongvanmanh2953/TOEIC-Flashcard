import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  StickyNote,
  Save,
  Tag,
  Folder,
  Pin,
  ExternalLink,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import { notesService, NoteCategory } from '../../services/notes.service';
import { useNavigate } from 'react-router-dom';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      notesService.getCategories().then(setCategories).catch(() => {});
      setTitle('');
      setContent('');
      setCategoryId('');
      setTags([]);
      setIsPinned(false);
      setSavedSuccess(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await notesService.createNote({
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || undefined,
        tags,
        isPinned,
      });

      setSavedSuccess(true);
      window.dispatchEvent(
        new CustomEvent('VOCABFLOW_TOAST', {
          detail: {
            type: 'success',
            title: 'Đã lưu ghi chép',
            message: 'Ghi chép nhanh đã được thêm vào không gian học tập của bạn.',
          },
        }),
      );

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFullWorkspace = () => {
    onClose();
    navigate('/notes');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Ghi chép nhanh
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Lưu từ vựng, ngữ pháp tức thì từ mọi màn hình
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenFullWorkspace}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Mở toàn bộ trang ghi chép (/notes)"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Title & Pin Toggle */}
          <div className="flex items-center gap-2">
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề ghi chép..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 transition"
            />
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2.5 rounded-2xl border transition ${
                isPinned
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="select-glass flex-1 !text-xs font-semibold"
            >
              <option value="">Chưa phân loại</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Area */}
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung kiến thức, quy tắc ngữ pháp hoặc từ mới vừa học..."
            className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 transition resize-none leading-relaxed"
          />

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
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
              placeholder="Tag + Enter..."
              className="flex-1 text-xs bg-transparent text-slate-700 dark:text-slate-200 focus:outline-hidden min-w-[120px]"
            />
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleOpenFullWorkspace}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Mở trang Ghi chép đầy đủ</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-glass-secondary btn-glass-sm !px-4"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="btn-glass-primary btn-glass-sm !px-5 font-bold"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : savedSuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{savedSuccess ? 'Đã lưu' : 'Lưu ghi chép'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
