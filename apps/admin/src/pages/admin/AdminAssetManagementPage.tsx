import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Music,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Layers,
  Copy,
  AlertTriangle,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Clock,
  Info,
  Check,
  Filter,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmModal } from '../../components/common/ConfirmDialog';
import { SearchableSelect, DropdownOption } from '../../components/common/SearchableSelect';

export interface AssetItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
  version?: number;
  updatedAt?: string;
  isUsed?: boolean;
  usageCount?: number;
  usedIn?: string[];
}

const ASSET_CATEGORIES = [
  { id: 'all', label: 'Tất cả danh mục' },
  { id: 'kid-animals', label: 'Kid / Động vật (Animals)' },
  { id: 'kid-food', label: 'Kid / Đồ ăn (Food)' },
  { id: 'kid-objects', label: 'Kid / Đồ vật (Objects)' },
  { id: 'kid-vehicles', label: 'Kid / Phương tiện (Vehicles)' },
  { id: 'kid-backgrounds', label: 'Kid / Hình nền (Backgrounds)' },
  { id: 'kid-rewards', label: 'Kid / Phần thưởng & Huy hiệu' },
  { id: 'games', label: 'Game Thẻ & Mini-games' },
  { id: 'audio', label: 'File âm thanh & Phát âm' },
  { id: 'student', label: 'Student / Minh họa bài học' },
];

export const AdminAssetManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<string>('kid-animals');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/assets', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setAssets(data);
    } catch {
      // Fallback with rich usage status data
      setAssets([
        {
          id: 'kid-animals/bear.webp',
          name: 'bear.webp',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/bear.webp',
          sizeBytes: 42300,
          mimeType: 'image/webp',
          version: 2,
          isUsed: true,
          usageCount: 2,
          usedIn: ['Từ vựng: "bear" (Flashcard)', 'Chủ đề: "Động vật"'],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'kid-animals/cat.webp',
          name: 'cat.webp',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/cat.webp',
          sizeBytes: 38200,
          mimeType: 'image/webp',
          version: 2,
          isUsed: true,
          usageCount: 2,
          usedIn: ['Từ vựng: "cat" (Flashcard)', 'Bài học Mầm non'],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'kid-animals/dog.webp',
          name: 'dog.webp',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/dog.webp',
          sizeBytes: 41100,
          mimeType: 'image/webp',
          version: 2,
          isUsed: true,
          usageCount: 1,
          usedIn: ['Từ vựng: "dog" (Flashcard)'],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'kid-animals/elephant.webp',
          name: 'elephant.webp',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/elephant.webp',
          sizeBytes: 54900,
          mimeType: 'image/webp',
          version: 2,
          isUsed: true,
          usageCount: 1,
          usedIn: ['Từ vựng: "elephant" (Flashcard)'],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'kid-animals/lion.webp',
          name: 'lion.webp',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/lion.webp',
          sizeBytes: 47200,
          mimeType: 'image/webp',
          version: 2,
          isUsed: true,
          usageCount: 1,
          usedIn: ['Từ vựng: "lion" (Flashcard)'],
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'kid-animals/old_draft_fox.png',
          name: 'old_draft_fox.png',
          category: 'kid-animals',
          url: 'https://assets.letstun.site/game-assets/animals/old_draft_fox.png',
          sizeBytes: 68300,
          mimeType: 'image/png',
          version: 1,
          isUsed: false,
          usageCount: 0,
          usedIn: [],
          updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'audio/sample_temp_bell.mp3',
          name: 'sample_temp_bell.mp3',
          category: 'audio',
          url: 'https://assets.letstun.site/audio/sample_temp_bell.mp3',
          sizeBytes: 25400,
          mimeType: 'audio/mpeg',
          version: 1,
          isUsed: false,
          usageCount: 0,
          usedIn: [],
          updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, statusFilter]);

  // Filtered displayed assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (selectedCategory !== 'all' && !asset.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter === 'used' && !asset.isUsed) return false;
      if (statusFilter === 'unused' && asset.isUsed) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          asset.name.toLowerCase().includes(q) ||
          asset.category.toLowerCase().includes(q) ||
          (asset.usedIn && asset.usedIn.some((u) => u.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [assets, selectedCategory, statusFilter, searchQuery]);

  // Overall counts
  const totalCount = assets.length;
  const usedCount = assets.filter((a) => a.isUsed).length;
  const unusedCount = assets.filter((a) => !a.isUsed).length;

  // Selected counts
  const selectedList = useMemo(() => {
    return assets.filter((a) => selectedIds.has(a.id));
  }, [assets, selectedIds]);

  const selectedUsedCount = selectedList.filter((a) => a.isUsed).length;
  const selectedUnusedCount = selectedList.filter((a) => !a.isUsed).length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    ASSET_CATEGORIES.forEach((c) => {
      if (c.id !== 'all') counts[c.id] = 0;
    });
    assets.forEach((a) => {
      if (counts[a.category] !== undefined) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    return counts;
  }, [assets]);

  const assetCategoryOptions: DropdownOption[] = useMemo(() => {
    return ASSET_CATEGORIES.map((cat) => ({
      value: cat.id,
      label: cat.label,
      badge: categoryCounts[cat.id] ?? (cat.id === 'all' ? assets.length : undefined),
    }));
  }, [categoryCounts, assets.length]);

  // Checkbox handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.size >= filteredAssets.length && filteredAssets.length > 0) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredAssets.forEach((a) => next.add(a.id));
      setSelectedIds(next);
    }
  };

  const handleSelectByStatus = (status: 'used' | 'unused') => {
    const next = new Set<string>();
    filteredAssets.forEach((a) => {
      if (status === 'used' && a.isUsed) next.add(a.id);
      if (status === 'unused' && !a.isUsed) next.add(a.id);
    });
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('category', uploadCategory);

    try {
      await api.post('/admin/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchAssets();
    } catch (err: any) {
      alert('Lỗi tải file lên: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyFeedback(url);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Delete single item
  const handleDeleteSingle = async (asset: AssetItem) => {
    let warningMsg = `Bạn có chắc chắn muốn xóa file "${asset.name}"? Thao tác này sẽ xóa file vĩnh viễn khỏi server.`;
    if (asset.isUsed) {
      warningMsg = `⚠️ CẢNH BÁO: File "${asset.name}" ĐANG ĐƯỢC SỬ DỤNG trong: ${asset.usedIn?.join(', ')}.\n\nViệc xóa file này có thể làm lỗi hiển thị hình ảnh hoặc phát âm trong bài học học viên. Bạn vẫn muốn tiếp tục xóa?`;
    }

    const confirmed = await confirmModal({
      title: asset.isUsed ? 'Cảnh báo xóa file đang sử dụng' : 'Xóa tài nguyên',
      message: warningMsg,
      type: asset.isUsed ? 'danger' : 'warning',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
    });
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`/admin/assets/${encodeURIComponent(asset.id)}`);
      // Update state locally
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa file');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete selected items
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    let warningMsg = `Bạn có chắc chắn muốn xóa ${selectedIds.size} tài nguyên đã chọn khỏi hệ thống?`;
    if (selectedUsedCount > 0) {
      warningMsg = `⚠️ CẢNH BÁO NGUY HIỂM:\nTrong số ${selectedIds.size} file đã chọn, có ${selectedUsedCount} file ĐANG ĐƯỢC SỬ DỤNG trong dữ liệu từ vựng/bài học!\n\nXóa các file này sẽ khiến hình ảnh/âm thanh trên ứng dụng bị lỗi. Bạn có chắc chắn muốn tiếp tục xóa?`;
    }

    const confirmed = await confirmModal({
      title: selectedUsedCount > 0 ? 'Xác nhận xóa tài nguyên (Có file đang dùng)' : 'Xóa hàng loạt tài nguyên',
      message: warningMsg,
      type: 'danger',
      confirmText: `Xác nhận xóa (${selectedIds.size})`,
      cancelText: 'Hủy bỏ',
    });
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const idsArray = Array.from(selectedIds);
      await api.post('/admin/assets/bulk-delete', { ids: idsArray });
      // Update local state
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      await fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tài nguyên hàng loạt');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Quản Lý Tài Nguyên Hệ Thống (Asset Management)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Phục vụ CDN trực tiếp:{' '}
            <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
              https://assets.letstun.site
            </code>{' '}
            • Kiểm tra trạng thái sử dụng và dọn dẹp file thừa an toàn.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dạng Lưới (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Lưới</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dạng Danh Sách (List)"
            >
              <List className="w-4 h-4" />
              <span>Danh Sách</span>
            </button>
          </div>

          {/* Upload Button */}
          <label className="btn-primary cursor-pointer flex items-center gap-2 px-4 py-2 text-sm shadow-sm hover:shadow-md transition">
            <Upload className="w-4 h-4" />
            <span>Tải Asset Mới</span>
            <input
              type="file"
              multiple
              accept="image/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>

          {/* Refresh */}
          <button
            onClick={fetchAssets}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng Tài Nguyên</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Đang Sử Dụng</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{usedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Chưa Sử Dụng</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{unusedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-500 font-semibold uppercase">Đã Chọn Để Xóa</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">{selectedIds.size}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs, Status Selector & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('used')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'used'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đang sử dụng ({usedCount})
            </button>
            <button
              onClick={() => setStatusFilter('unused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'unused'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Chưa sử dụng ({unusedCount})
            </button>
          </div>

          {/* Quick Select by Status & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Chọn nhanh:</span>
            <button
              onClick={() => handleSelectByStatus('unused')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
              title="Chọn tất cả các file chưa liên kết để xóa dọn dẹp"
            >
              Chọn file chưa dùng ({unusedCount})
            </button>
            <button
              onClick={() => handleSelectByStatus('used')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
            >
              Chọn file đang dùng ({usedCount})
            </button>
            <button
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {selectedIds.size >= filteredAssets.length && filteredAssets.length > 0
                ? 'Bỏ chọn tất cả'
                : 'Chọn tất cả hiển thị'}
            </button>
          </div>
        </div>

        {/* Category Dropdown & Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-80 shrink-0">
            <SearchableSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={assetCategoryOptions}
              placeholder="Chọn danh mục tài nguyên..."
              searchPlaceholder="Tìm kiếm danh mục..."
              size="md"
            />
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên file, bài học, từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500 h-10 min-h-[40px]"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Đã chọn <span className="text-amber-400">{selectedIds.size}</span> tài nguyên
              </p>
              <p className="text-[11px] text-slate-300">
                Gồm: <strong className="text-amber-400">{selectedUnusedCount}</strong> chưa sử dụng,{' '}
                <strong className={selectedUsedCount > 0 ? 'text-rose-400' : 'text-slate-300'}>
                  {selectedUsedCount}
                </strong>{' '}
                đang sử dụng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa đã chọn ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: List View vs Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">Đang quét kho tài nguyên hệ thống...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy tài nguyên phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hãy thử thay đổi danh mục, từ khóa tìm kiếm hoặc lọc trạng thái để xem các tài nguyên khác.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* ================== LIST / TABLE VIEW ================== */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      onClick={handleSelectAllVisible}
                      className="text-slate-400 hover:text-indigo-600 transition"
                      title="Chọn tất cả"
                    >
                      {selectedIds.size >= filteredAssets.length && filteredAssets.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Tài nguyên & Xem trước</th>
                  <th className="p-3.5">Danh mục</th>
                  <th className="p-3.5">Dung lượng</th>
                  <th className="p-3.5">Trạng thái sử dụng</th>
                  <th className="p-3.5">Cập nhật</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedIds.has(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(asset.id)}
                          className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Preview & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {asset.mimeType?.startsWith('audio') ? (
                              <Music className="w-5 h-5 text-indigo-500" />
                            ) : (
                              <img
                                src={asset.url}
                                alt={asset.name}
                                loading="lazy"
                                className="w-full h-full object-contain p-1"
                              />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate" title={asset.name}>
                              {asset.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{asset.url}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {asset.category}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {formatFileSize(asset.sizeBytes)}
                      </td>

                      {/* Status: In Use vs Unused */}
                      <td className="p-3.5">
                        {asset.isUsed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đang sử dụng
                            </span>
                            {asset.usedIn && asset.usedIn.length > 0 && (
                              <p className="text-[10px] text-slate-400 line-clamp-1" title={asset.usedIn.join(' • ')}>
                                {asset.usedIn[0]}
                                {asset.usedIn.length > 1 ? ` (+${asset.usedIn.length - 1})` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Chưa sử dụng
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyUrl(asset.url)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Sao chép link CDN"
                          >
                            {copyFeedback === asset.url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Xem file gốc"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteSingle(asset)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                            title={asset.isUsed ? 'File đang dùng - Cần xác nhận cẩn trọng' : 'Xóa file'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================== GRID VIEW ================== */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.has(asset.id);
            return (
              <div
                key={asset.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl border p-3 flex flex-col items-center justify-between hover:shadow-lg transition-all ${
                  isSelected
                    ? 'border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Select Checkbox at top-left of Card */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={() => handleToggleSelect(asset.id)}
                    className="p-1 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                    title={isSelected ? 'Bỏ chọn' : 'Chọn để xóa'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Status Badge at top-right of Card */}
                <div className="absolute top-2 right-2 z-10">
                  {asset.isUsed ? (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500 text-white shadow-xs"
                      title={asset.usedIn?.join(' • ') || 'Đang sử dụng'}
                    >
                      ĐANG DÙNG
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-xs">
                      CHƯA DÙNG
                    </span>
                  )}
                </div>

                {/* Asset Preview Frame */}
                <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-2 relative mt-4">
                  {asset.mimeType?.startsWith('audio') ? (
                    <Music className="w-10 h-10 text-indigo-400" />
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                    />
                  )}

                  {/* Hover Actions Toolbar */}
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 p-1 rounded-xl shadow-md">
                    <button
                      onClick={() => handleCopyUrl(asset.url)}
                      className="p-1 rounded-lg text-slate-700 hover:text-indigo-600"
                      title="Sao chép link CDN"
                    >
                      {copyFeedback === asset.url ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg text-slate-700 hover:text-indigo-600"
                      title="Mở liên kết gốc"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteSingle(asset)}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                      title="Xóa file này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Asset Info */}
                <div className="w-full text-center">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                    {asset.category} • {formatFileSize(asset.sizeBytes)}
                  </p>
                  {asset.isUsed && asset.usedIn && asset.usedIn.length > 0 && (
                    <p
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5 font-medium"
                      title={asset.usedIn.join(', ')}
                    >
                      {asset.usedIn[0]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAssetManagementPage;
