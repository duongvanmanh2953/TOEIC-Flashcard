import React, { useState, useEffect } from 'react';
import {
  Upload,
  Folder,
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
} from 'lucide-react';
import api from '../../lib/api';

interface AssetItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
  version?: number;
  updatedAt?: string;
}

const ASSET_CATEGORIES = [
  { id: 'all', label: 'Tất cả tài nguyên' },
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<string>('kid-animals');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/assets', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined,
        },
      });
      if (res.data?.data) {
        setAssets(res.data.data);
      } else if (Array.isArray(res.data)) {
        setAssets(res.data);
      }
    } catch {
      // Fallback to sample asset catalogue if endpoint is initializing
      setAssets([
        {
          id: 'bear',
          name: 'bear.webp',
          category: 'kid-animals',
          url: 'https://assets.vocalflow.site/game-assets/animals/bear.webp',
          sizeBytes: 42300,
          mimeType: 'image/webp',
          version: 2,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat',
          name: 'cat.webp',
          category: 'kid-animals',
          url: 'https://assets.vocalflow.site/game-assets/animals/cat.webp',
          sizeBytes: 38200,
          mimeType: 'image/webp',
          version: 2,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'dog',
          name: 'dog.webp',
          category: 'kid-animals',
          url: 'https://assets.vocalflow.site/game-assets/animals/dog.webp',
          sizeBytes: 41100,
          mimeType: 'image/webp',
          version: 2,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'elephant',
          name: 'elephant.webp',
          category: 'kid-animals',
          url: 'https://assets.vocalflow.site/game-assets/animals/elephant.webp',
          sizeBytes: 54900,
          mimeType: 'image/webp',
          version: 2,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'lion',
          name: 'lion.webp',
          category: 'kid-animals',
          url: 'https://assets.vocalflow.site/game-assets/animals/lion.webp',
          sizeBytes: 47200,
          mimeType: 'image/webp',
          version: 2,
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory]);

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
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyFeedback(url);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" />
            Quản Lý Tài Nguyên Đa Phương Tiện (Asset Management)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Phục vụ trực tiếp qua CDN/Server chuyên biệt:{' '}
            <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
              https://assets.vocalflow.site
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn-primary cursor-pointer flex items-center gap-2 px-4 py-2 text-sm">
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

          <button
            onClick={fetchAssets}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAssets()}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col items-center justify-between hover:shadow-lg transition-all"
          >
            {/* Asset Preview Frame */}
            <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-2 relative">
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

              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={() => handleCopyUrl(asset.url)}
                  className="p-1 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow text-slate-700 hover:text-indigo-600"
                  title="Sao chép URL công khai"
                >
                  {copyFeedback === asset.url ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow text-slate-700 hover:text-indigo-600"
                  title="Mở liên kết gốc"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Asset Info */}
            <div className="w-full text-center">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={asset.name}>
                {asset.name}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                {asset.category} {asset.version ? `• v${asset.version}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAssetManagementPage;
