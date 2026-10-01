import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  FolderPlus,
  Folder,
  Pin,
  Archive,
  Tag,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Menu,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  notesService,
  NoteItem,
  NoteCategory,
  NotesOverviewCount,
  NoteUsageResponse,
} from '../../services/notes.service';
import { VirtualScrollList } from '../../components/common/VirtualScrollList';
import { NoteEditor } from '../../components/notes/NoteEditor';
import { CategoryModal } from '../../components/notes/CategoryModal';
import { QuotaMeter } from '../../components/common/QuotaMeter';

export const NotesPage: React.FC = () => {
  // State: Categories & Overview
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [overviewCount, setOverviewCount] = useState<NotesOverviewCount>({
    totalNotes: 0,
    activeNotes: 0,
    archivedNotes: 0,
    categoriesCount: 0,
  });
  const [notesUsage, setNotesUsage] = useState<NoteUsageResponse | null>(null);

  // State: Selected Filters & Search
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'pinned' | 'archived' | 'uncategorized'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'updated' | 'title'>('latest');

  // State: Notes List & Cursor Pagination
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  // State: Active Note & Editor
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Modals & Mobile View Switchers
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NoteCategory | null>(null);
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search debounce ref & AbortController to prevent race condition
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestSeq = useRef(0);

  // 1. Fetch Categories & Overview Counts & Quota Usage
  const loadCategoriesAndOverview = async () => {
    try {
      const [cats, counts, usageRes] = await Promise.all([
        notesService.getCategories(),
        notesService.getNotesCount(),
        notesService.getNotesUsage().catch(() => null),
      ]);
      setCategories(cats);
      setOverviewCount(counts);
      if (usageRes) setNotesUsage(usageRes);
    } catch (err) {
      console.error('Failed to load categories/counts:', err);
    }
  };

  useEffect(() => {
    loadCategoriesAndOverview();
  }, []);

  // 2. Fetch Notes with Cursor Pagination & Race Condition Cancellation
  const fetchNotes = useCallback(
    async (isInitial = true, cursorToUse?: string) => {
      const currentSeq = ++activeRequestSeq.current;

      if (isInitial) {
        setIsLoadingInitial(true);
        setIsError(false);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const query: any = {
          limit: 30,
          sortBy,
          search: searchKeyword.trim() || undefined,
          tag: selectedTag || undefined,
        };

        if (cursorToUse) {
          query.cursor = cursorToUse;
        }

        if (filterView === 'archived') {
          query.isArchived = true;
        } else if (filterView === 'pinned') {
          query.isPinned = true;
          query.isArchived = false;
        } else if (filterView === 'uncategorized') {
          query.categoryId = 'uncategorized';
          query.isArchived = false;
        } else if (selectedCategoryId) {
          query.categoryId = selectedCategoryId;
          query.isArchived = false;
        } else {
          query.isArchived = false;
        }

        const res = await notesService.getNotes(query);

        // Discard result if newer request has been triggered
        if (currentSeq !== activeRequestSeq.current) return;

        if (isInitial) {
          setNotes(res.items);
          if (res.items.length > 0 && !selectedNote && window.innerWidth >= 1024) {
            setSelectedNote(res.items[0]);
          }
        } else {
          setNotes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newUnique = res.items.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newUnique];
          });
        }

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (err) {
        if (currentSeq === activeRequestSeq.current) {
          setIsError(true);
        }
      } finally {
        if (currentSeq === activeRequestSeq.current) {
          setIsLoadingInitial(false);
          setIsLoadingMore(false);
        }
      }
    },
    [filterView, selectedCategoryId, searchKeyword, selectedTag, sortBy],
  );

  // Debounce search by 300ms
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchNotes(true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchKeyword, filterView, selectedCategoryId, selectedTag, sortBy]);

  // Load more on scroll
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && nextCursor) {
      fetchNotes(false, nextCursor);
    }
  };

  // 3. Create New Note Action
  const handleCreateNewNote = async () => {
    try {
      const newNote = await notesService.createNote({
        title: 'Ghi chép mới',
        content: '',
        categoryId: selectedCategoryId || undefined,
        tags: selectedTag ? [selectedTag] : [],
        isPinned: filterView === 'pinned',
      });

      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setMobilePane('editor');
      loadCategoriesAndOverview();
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // 4. Save/Update Note
  const handleSaveNote = async (data: {
    title: string;
    content: string;
    categoryId?: string | null;
    tags: string[];
    isPinned: boolean;
    isArchived: boolean;
  }) => {
    if (!selectedNote) return;

    setIsSavingNote(true);
    try {
      const updated = await notesService.updateNote(selectedNote.id, data);

      // Update in active notes list
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
      setSelectedNote(updated);
      loadCategoriesAndOverview();
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // 5. Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Bạn có chắc muốn chuyển ghi chép này vào thùng rác?')) return;
    try {
      await notesService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
        setMobilePane('list');
      }
      loadCategoriesAndOverview();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // 6. Category CRUD
  const handleSaveCategory = async (data: { name: string; description?: string; color?: string }) => {
    if (editingCategory) {
      await notesService.updateCategory(editingCategory.id, data);
    } else {
      await notesService.createCategory(data);
    }
    loadCategoriesAndOverview();
  };

  const handleDeleteCategory = async (id: string) => {
    await notesService.deleteCategory(id);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
    loadCategoriesAndOverview();
    fetchNotes(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      {/* TOP HEADER: Overview, Counts, Mobile Toggle */}
      <header className="shrink-0 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Ghi chép cá nhân
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-black border border-indigo-200/60 dark:border-indigo-800/60">
                  {overviewCount.activeNotes} ghi chép
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Không gian lưu trữ kiến thức học tập, từ vựng & cấu trúc ngữ pháp
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {mobilePane === 'editor' && (
            <button
              onClick={() => setMobilePane('list')}
              className="lg:hidden px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              ← Danh sách
            </button>
          )}
          <button
            onClick={handleCreateNewNote}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo ghi chép</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE 3-PANE LAYOUT */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* =====================================================================
            1. LEFT PANE: Categories Sidebar (Desktop + Mobile Drawer)
            ===================================================================== */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Mobile close button */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:hidden">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chuyên mục</span>
            <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="p-3 space-y-1 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => {
                setFilterView('all');
                setSelectedCategoryId(null);
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                filterView === 'all' && !selectedCategoryId
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Tất cả ghi chép</span>
              </div>
              <span className="text-[10px] font-bold opacity-75">{overviewCount.activeNotes}</span>
            </button>

            <button
              onClick={() => {
                setFilterView('pinned');
                setSelectedCategoryId(null);
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                filterView === 'pinned'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>Đã ghim</span>
              </div>
            </button>

            <button
              onClick={() => {
                setFilterView('uncategorized');
                setSelectedCategoryId(null);
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                filterView === 'uncategorized'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                <span>Chưa phân loại</span>
              </div>
            </button>

            <button
              onClick={() => {
                setFilterView('archived');
                setSelectedCategoryId(null);
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                filterView === 'archived'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5" />
                <span>Đã lưu trữ</span>
              </div>
              <span className="text-[10px] font-bold opacity-75">{overviewCount.archivedNotes}</span>
            </button>
          </div>

          {/* Dynamic Categories Header */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Chuyên mục ({categories.length})
            </span>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition flex items-center gap-0.5 text-xs font-bold"
              title="Thêm mục mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>
          </div>

          {/* Dynamic Categories List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setFilterView('all');
                  setMobileSidebarOpen(false);
                }}
                className={`group px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                  selectedCategoryId === cat.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                    {cat.noteCount}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      setCategoryModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title="Chỉnh sửa chuyên mục"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quota / Usage Footer Indicator */}
          {notesUsage && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <QuotaMeter
                label="Hạn mức ghi chú"
                feature="NOTES"
                used={notesUsage.used}
                limit={notesUsage.unlimited ? -1 : notesUsage.limit}
                remaining={notesUsage.remaining}
              />
            </div>
          )}
        </aside>

        {/* =====================================================================
            2. MIDDLE PANE: Virtualized Note Cards List
            ===================================================================== */}
        <section
          className={`w-full lg:w-80 xl:w-96 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 shrink-0 ${
            mobilePane === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search & Sort Controls */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-white/50 dark:bg-slate-900/50 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm ghi chép, tag, từ vựng..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort bar & Tag indicator */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <ArrowUpDown className="w-3 h-3" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[11px] font-semibold text-slate-600 dark:text-slate-400 focus:outline-hidden"
                >
                  <option value="latest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="updated">Vừa cập nhật</option>
                  <option value="title">Theo tiêu đề (A-Z)</option>
                </select>
              </div>

              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                  #{selectedTag}
                  <button onClick={() => setSelectedTag(null)} className="font-bold">
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Virtualized Notes List (Capped DOM Nodes, infinite scroll) */}
          <div className="flex-1 min-h-0">
            <VirtualScrollList<NoteItem>
              items={notes}
              itemKey={(item) => item.id}
              estimatedItemHeight={110}
              hasMore={hasMore}
              isLoadingInitial={isLoadingInitial}
              isLoadingMore={isLoadingMore}
              isError={isError}
              onLoadMore={handleLoadMore}
              onRetry={() => fetchNotes(true)}
              containerClassName="h-full px-2.5 py-2"
              contentClassName="pb-2"
              renderItem={(item) => {
                const isSelected = selectedNote?.id === item.id;
                return (
                  <div
                    onClick={() => {
                      setSelectedNote(item);
                      setMobilePane('editor');
                    }}
                    className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer mb-2 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                        : 'bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.isPinned && (
                          <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                        )}
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {item.title || 'Ghi chép chưa đặt tên'}
                        </h4>
                      </div>

                      {item.category && (
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded-md font-bold shrink-0 truncate max-w-[90px]"
                          style={{
                            backgroundColor: `${item.category.color}20`,
                            color: item.category.color,
                          }}
                        >
                          {item.category.name}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.plainTextPreview || 'Chưa có nội dung...'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                      </span>

                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          {item.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-indigo-500 font-semibold truncate">
                              #{t}
                            </span>
                          ))}
                          {item.tags.length > 2 && <span>+{item.tags.length - 2}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </section>

        {/* =====================================================================
            3. RIGHT PANE: Note Detail & Rich Text Editor
            ===================================================================== */}
        <main
          className={`flex-1 min-h-0 bg-white dark:bg-slate-900 ${
            mobilePane === 'list' ? 'hidden lg:flex flex-col' : 'flex flex-col'
          }`}
        >
          <NoteEditor
            note={selectedNote}
            categories={categories}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            isSaving={isSavingNote}
          />
        </main>
      </div>
    </div>
  );
};
