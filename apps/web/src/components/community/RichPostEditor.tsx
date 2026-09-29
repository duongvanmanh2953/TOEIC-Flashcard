import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  Table as TableIcon,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  BookOpen,
  FileCode,
  Eye,
  Edit3,
  UploadCloud,
  Loader2,
  Undo2,
  Redo2,
  RemoveFormatting,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { RichContentRenderer } from './RichContentRenderer';
import { CountryFlag } from '../language/CountryFlag';

interface RichPostEditorProps {
  value: string;
  onChange: (val: string) => void;
  onImportDocument?: (file: File) => void;
  isParsingDoc?: boolean;
  previewMetadata?: {
    title: string;
    topicName?: string;
    topicColor?: string;
    language: string;
    tags: string[];
    authorName?: string;
    authorAvatar?: string | null;
  };
}

type EditorMode = 'visual' | 'source' | 'preview';

export const RichPostEditor: React.FC<RichPostEditorProps> = ({
  value,
  onChange,
  onImportDocument,
  isParsingDoc = false,
  previewMetadata,
}) => {
  const [mode, setMode] = useState<EditorMode>('visual');
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync value into visual editor when mode switches to visual or initial load
  useEffect(() => {
    if (mode === 'visual' && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        visualEditorRef.current.innerHTML = value || '';
      }
    }
  }, [mode]);

  // Keep internal HTML in sync
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  // Execute formatting command on contentEditable
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (mode !== 'visual') return;
    visualEditorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleVisualInput();
  };

  // Format block (heading, paragraph)
  const formatHeading = (tag: 'p' | 'h2' | 'h3' | 'h4') => {
    if (mode === 'visual') {
      visualEditorRef.current?.focus();
      document.execCommand('formatBlock', false, tag);
      handleVisualInput();
    } else if (mode === 'source') {
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;
      onChange(`${value}\n${openTag}Tiêu đề mới${closeTag}\n`);
    }
  };

  // Custom Highlight command using <mark>
  const toggleHighlight = () => {
    if (mode !== 'visual') return;
    visualEditorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const selectedText = range.toString();
    const markNode = document.createElement('mark');
    markNode.textContent = selectedText;

    range.deleteContents();
    range.insertNode(markNode);
    handleVisualInput();
  };

  // Insert Custom HTML Snippet into visual or source editor
  const insertCustomHtml = (htmlSnippet: string) => {
    if (mode === 'visual') {
      visualEditorRef.current?.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = htmlSnippet;
        const frag = document.createDocumentFragment();
        let node;
        let lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML += htmlSnippet;
        }
      }
      handleVisualInput();
    } else {
      onChange(value ? `${value}\n\n${htmlSnippet}` : htmlSnippet);
    }
  };

  // Insert Callout Blocks
  const insertCallout = (type: 'tip' | 'note' | 'trap' | 'vocab') => {
    let snippet = '';
    switch (type) {
      case 'tip':
        snippet = `
<div class="toeic-callout tip">
  <div class="callout-header">💡 Mẹo làm bài thi TOEIC</div>
  <div class="callout-body">Nhập phương pháp nhận biết nhanh hoặc chiến thuật làm bài tại đây...</div>
</div><p><br/></p>`;
        break;
      case 'note':
        snippet = `
<div class="toeic-callout note">
  <div class="callout-header">📌 Lưu ý ngữ pháp quan trọng</div>
  <div class="callout-body">Ghi chú các trường hợp ngoại lệ hoặc công thức trọng tâm cần nhớ kỹ...</div>
</div><p><br/></p>`;
        break;
      case 'trap':
        snippet = `
<div class="toeic-callout trap">
  <div class="callout-header">⚠️ Cảnh báo bẫy thi thường gặp</div>
  <div class="callout-body">Phân tích những phương án gây nhiễu mà người ra đề hay sử dụng để đánh lừa...</div>
</div><p><br/></p>`;
        break;
      case 'vocab':
        snippet = `
<div class="toeic-callout vocab">
  <div class="callout-header">📖 Thẻ từ vựng trọng điểm</div>
  <div class="callout-body">
    <p><strong>Từ vựng:</strong> <em>/phiên_âm/</em> - Ý nghĩa chính</p>
    <p><strong>Cụm từ hay gặp:</strong> Collocation đi kèm</p>
    <p><strong>Ví dụ câu:</strong> <em>"The board approved the budget unanimously."</em></p>
  </div>
</div><p><br/></p>`;
        break;
    }
    insertCustomHtml(snippet);
  };

  // Insert Comparison Table
  const insertComparisonTable = () => {
    const tableSnippet = `
<div class="overflow-x-auto my-4">
  <table class="rich-table">
    <thead>
      <tr>
        <th>Chủ điểm ngữ pháp / Cấu trúc</th>
        <th>Cách dùng & Dấu hiệu</th>
        <th>Ví dụ minh họa chuẩn TOEIC</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Thì Hiện tại hoàn thành</strong></td>
        <td>Diễn tả hành động xảy ra trong quá khứ kéo dài đến hiện tại</td>
        <td>We <em>have worked</em> here since 2020.</td>
      </tr>
      <tr>
        <td><strong>Thì Quá khứ đơn</strong></td>
        <td>Hành động đã chấm dứt hoàn toàn tại một thời điểm xác định</td>
        <td>The manager <em>visited</em> the factory yesterday.</td>
      </tr>
    </tbody>
  </table>
</div><p><br/></p>`;
    insertCustomHtml(tableSnippet);
  };

  // Save selection before opening link modal
  const handleOpenLinkModal = () => {
    if (mode === 'visual') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedSelectionRef.current = selection.getRangeAt(0);
        setLinkText(selection.toString() || '');
      }
    }
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const text = linkText.trim() || url;

    if (mode === 'visual') {
      visualEditorRef.current?.focus();
      if (savedSelectionRef.current) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedSelectionRef.current);
      }
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      insertCustomHtml(linkHtml);
    } else {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      onChange(`${value} ${linkHtml}`);
    }
    setLinkModalOpen(false);
  };

  // Statistics calculation
  const stats = React.useMemo(() => {
    const textOnly = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textOnly ? textOnly.split(' ').filter(Boolean).length : 0;
    const chars = textOnly.length;
    const readMinutes = Math.max(1, Math.ceil(words / 180));
    const kb = (new Blob([value]).size / 1024).toFixed(1);
    return { words, chars, readMinutes, kb };
  }, [value]);

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
      {/* Hidden File Input for Word/PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf,.md,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onImportDocument) {
            onImportDocument(file);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />

      {/* Main Top Header: Mode Switcher & Import Action */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
        {/* Editor Mode Tabs */}
        <div className="tab-pill-container !p-1">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`tab-pill ${mode === 'visual' ? 'tab-pill-active' : ''} text-xs py-1 px-3`}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            <span>Soạn thảo trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('source')}
            className={`tab-pill ${mode === 'source' ? 'tab-pill-active' : ''} text-xs py-1 px-3`}
          >
            <FileCode className="w-3.5 h-3.5 mr-1.5" />
            <span>Mã nguồn HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`tab-pill ${mode === 'preview' ? 'tab-pill-active' : ''} text-xs py-1 px-3`}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            <span>Xem trước hoàn chỉnh</span>
          </button>
        </div>

        {/* Right Action: Word / PDF Import */}
        <div className="flex items-center gap-2">
          {onImportDocument && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingDoc}
              title="Nhập bài viết từ file Word (.docx) hoặc PDF sang HTML chuẩn"
              className="btn-glass-secondary btn-glass-sm !px-3 !py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group cursor-pointer"
            >
              {isParsingDoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              )}
              <span>{isParsingDoc ? 'Đang trích xuất HTML...' : 'Nhập Word / PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Formatting Toolbar (Active in Visual and Source modes) */}
      {mode !== 'preview' && (
        <div className="p-2 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center gap-1 flex-wrap text-xs">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => formatHeading('p')}
              className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              title="Đoạn văn (Paragraph)"
            >
              Văn bản
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h2')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Tiêu đề chính (H2)"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h3')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Tiêu đề phụ (H3)"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h4')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Tiêu đề nhỏ (H4)"
            >
              <Heading4 className="w-4 h-4" />
            </button>
          </div>

          {/* Basic Text Formatting */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="In đậm (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="In nghiêng (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Gạch chân (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Gạch ngang"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleHighlight}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="Tô sáng (Highlight)"
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => executeCommand('justifyLeft')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Căn trái"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyCenter')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Căn giữa"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyRight')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Căn phải"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Danh sách dấu chấm"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Danh sách số"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertCustomHtml('<blockquote>Nhập đoạn trích dẫn tại đây...</blockquote><p><br/></p>')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Trích dẫn (Blockquote)"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertCustomHtml('<hr class="my-6 border-slate-200 dark:border-slate-800"/><p><br/></p>')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Đường kẻ phân đoạn"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleOpenLinkModal}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Chèn liên kết URL"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* TOEIC Academic Callout Inserter */}
          <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertCallout('tip')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition"
              title="Chèn hộp mẹo làm bài thi TOEIC"
            >
              <Lightbulb className="w-3.5 h-3.5 text-cyan-500" />
              <span>Mẹo thi</span>
            </button>
            <button
              type="button"
              onClick={() => insertCallout('note')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
              title="Chèn hộp lưu ý ngữ pháp quan trọng"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Lưu ý</span>
            </button>
            <button
              type="button"
              onClick={() => insertCallout('trap')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
              title="Chèn cảnh báo bẫy thi thường gặp"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Bẫy đề</span>
            </button>
            <button
              type="button"
              onClick={() => insertCallout('vocab')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
              title="Chèn thẻ từ vựng trọng tâm"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>Từ vựng</span>
            </button>
          </div>

          {/* Table Inserter */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={insertComparisonTable}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              title="Chèn bảng so sánh ngữ pháp/từ vựng chuẩn"
            >
              <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chèn bảng</span>
            </button>
          </div>

          {/* Undo / Redo & Clear Format */}
          <div className="flex items-center gap-0.5 pl-1">
            <button
              type="button"
              onClick={() => executeCommand('undo')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('redo')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('removeFormat')}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Xóa định dạng"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Body Area */}
      <div className="flex-1 min-h-[420px] relative">
        {/* Mode: Visual (WYSIWYG) */}
        {mode === 'visual' && (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            onBlur={handleVisualInput}
            className="w-full min-h-[420px] p-6 focus:outline-hidden rich-post-content text-slate-800 dark:text-slate-100 leading-relaxed font-sans cursor-text selection:bg-indigo-500/20"
            data-placeholder="Trình bày giải thích chi tiết, ví dụ câu, phân tích lỗi sai và lời khuyên học tập..."
          />
        )}

        {/* Mode: Source (Raw HTML) */}
        {mode === 'source' && (
          <div className="p-4 bg-slate-900 text-slate-100 min-h-[420px] flex flex-col">
            <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center justify-between">
              <span>Mã nguồn HTML sạch (An toàn XSS & tương thích 100% với hệ thống)</span>
              <span>Kích thước: {stats.kb} KB</span>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={16}
              className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-indigo-300 focus:outline-hidden focus:border-indigo-500 resize-y leading-relaxed"
              placeholder="<p>Nhập mã HTML bài viết tại đây...</p>"
            />
          </div>
        )}

        {/* Mode: Live Preview (Complete Post Simulation) */}
        {mode === 'preview' && (
          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-950/40 min-h-[420px]">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Preview Header Metadata */}
              {previewMetadata && (
                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {previewMetadata.topicName && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: previewMetadata.topicColor || '#6366f1' }}
                        />
                        {previewMetadata.topicName}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      <CountryFlag languageId={previewMetadata.language} size="xs" />
                      <span className="uppercase">{previewMetadata.language}</span>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-xs">Ước tính {stats.readMinutes} phút đọc</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {previewMetadata.title || <span className="text-slate-400 italic">Chưa có tiêu đề bài viết</span>}
                  </h1>

                  {/* Author Simulation */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {previewMetadata.authorName ? previewMetadata.authorName[0] : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {previewMetadata.authorName || 'Tác giả bài viết'}
                      </div>
                      <div className="text-[10px] text-slate-400">Xem trước hiển thị thực tế trên cộng đồng</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rendered HTML Content */}
              <RichContentRenderer content={value} />

              {/* Tags Simulation */}
              {previewMetadata?.tags && previewMetadata.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-4 border-t border-slate-200 dark:border-slate-800">
                  {previewMetadata.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Status Bar Footer */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            Số từ: <strong className="text-slate-700 dark:text-slate-200">{stats.words}</strong>
          </span>
          <span>·</span>
          <span>
            Ký tự: <strong className="text-slate-700 dark:text-slate-200">{stats.chars}</strong>
          </span>
          <span>·</span>
          <span>
            Thời gian đọc: <strong className="text-slate-700 dark:text-slate-200">~{stats.readMinutes} phút</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stats.words < 20 ? (
            <span className="text-amber-500 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Nội dung ngắn (khuyến nghị trên 50 từ)
            </span>
          ) : (
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Độ dài bài viết đạt chuẩn học thuật
            </span>
          )}
        </div>
      </div>

      {/* Link Insertion Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <span>Chèn liên kết vào bài viết</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Văn bản hiển thị
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="VD: Xem thêm đề thi thử TOEIC ETS..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Địa chỉ liên kết (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/tai-lieu-toeic"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="btn-glass-secondary btn-glass-sm !px-3 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                disabled={!linkUrl.trim()}
                className="btn-glass-primary btn-glass-sm !px-4 font-bold"
              >
                Chèn liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
