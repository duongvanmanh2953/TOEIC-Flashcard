import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Archive,
  RefreshCw,
  Tag,
  Layers,
  Sparkles,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  Check,
  X,
  FileText,
  Bookmark,
  ChevronRight,
  Headphones,
  Award,
  BookMarked,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { CustomSelect } from '../../components/ui/CustomSelect';

interface LearningResource {
  id: string;
  title: string;
  description?: string;
  type: string;
  level: string;
  category?: string;
  content: string;
  audioUrl?: string;
  imageUrl?: string;
  language: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  isPremium: boolean;
  requiredPlan: string;
  tags: string[];
  metadata?: any;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

const RESOURCE_TYPES = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: 'VOCABULARY', label: 'Từ vựng & Cụm từ' },
  { value: 'GRAMMAR', label: 'Ngữ pháp chuyên sâu' },
  { value: 'PRONUNCIATION', label: 'Luyện phát âm' },
  { value: 'LESSON', label: 'Bài giảng lý thuyết' },
  { value: 'EXERCISE', label: 'Bài tập tương tác' },
  { value: 'SCENARIO', label: 'Tình huống AI Coach' },
  { value: 'READING', label: 'Bài đọc hiểu' },
  { value: 'LISTENING', label: 'Bài nghe hiểu' },
];

const CEFR_LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const REQUIRED_PLANS = ['ALL', 'FREE', 'PLUS', 'PRO'];
const STATUSES = ['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'];

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
  A2: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300',
  B1: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300',
  B2: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
  C1: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-300',
  C2: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300',
};

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedPlan, setSelectedPlan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'VOCABULARY',
    level: 'B1',
    category: 'General',
    content: '',
    audioUrl: '',
    imageUrl: '',
    language: 'en',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    isPremium: false,
    requiredPlan: 'FREE',
    tagsInput: '',
  });

  const fetchResources = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedType !== 'ALL') params.type = selectedType;
      if (selectedLevel !== 'ALL') params.level = selectedLevel;
      if (selectedPlan !== 'ALL') params.requiredPlan = selectedPlan;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const res: any = await api.get('/admin/resources', { params });
      const data = res.data?.data || res.data || res;

      if (data && Array.isArray(data.items)) {
        setResources(data.items);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err: any) {
      console.error('Failed to load learning resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(1);
  }, [selectedType, selectedLevel, selectedPlan, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources(1);
  };

  const openCreateModal = () => {
    setActiveResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'VOCABULARY',
      level: 'B1',
      category: 'General Business',
      content: `# Tiêu đề tài nguyên\n\n### Nội dung chính\n- Điểm 1\n- Điểm 2\n\n### Ví dụ minh họa\n*Câu ví dụ minh họa ngữ cảnh thực tế...*`,
      audioUrl: '',
      imageUrl: '',
      language: 'en',
      status: 'PUBLISHED',
      isPremium: false,
      requiredPlan: 'FREE',
      tagsInput: 'TOEIC, Business, B1',
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (res: LearningResource) => {
    setActiveResource(res);
    setFormData({
      title: res.title,
      description: res.description || '',
      type: res.type,
      level: res.level,
      category: res.category || 'General',
      content: res.content || '',
      audioUrl: res.audioUrl || '',
      imageUrl: res.imageUrl || '',
      language: res.language || 'en',
      status: res.status,
      isPremium: res.isPremium,
      requiredPlan: res.requiredPlan,
      tagsInput: Array.isArray(res.tags) ? res.tags.join(', ') : '',
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const openPreviewModal = (res: LearningResource) => {
    setActiveResource(res);
    setPreviewOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const tags = formData.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        level: formData.level,
        category: formData.category,
        content: formData.content,
        audioUrl: formData.audioUrl || null,
        imageUrl: formData.imageUrl || null,
        language: formData.language,
        status: formData.status,
        isPremium: formData.isPremium,
        requiredPlan: formData.requiredPlan,
        tags,
      };

      if (activeResource) {
        await api.patch(`/admin/resources/${activeResource.id}`, payload);
      } else {
        await api.post('/admin/resources', payload);
      }

      setEditorOpen(false);
      fetchResources();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Lỗi khi lưu tài nguyên học tập');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (res: LearningResource) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài nguyên "${res.title}"?`)) return;

    try {
      await api.delete(`/admin/resources/${res.id}`);
      fetchResources();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tài nguyên');
    }
  };

  const handleStatusChange = async (res: LearningResource, newStatus: string) => {
    try {
      await api.patch(`/admin/resources/${res.id}/status`, { status: newStatus });
      fetchResources();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const totalPublished = resources.filter((r) => r.status === 'PUBLISHED').length;
  const totalPremium = resources.filter((r) => r.isPremium || r.requiredPlan !== 'FREE').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Learning Content & Resources
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Content Hub
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản trị kho học liệu, cấu trúc bài giảng ngữ pháp, từ vựng và các kịch bản thực hành AI Coach
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchResources()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Nguyên Mới</span>
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
              Tổng số học liệu
            </span>
            <BookOpen className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {pagination.total}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bao gồm bài đọc, từ vựng, ngữ pháp, kịch bản
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Đã xuất bản (Published)
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalPublished}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sẵn sàng hiển thị trên app người học
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
              Học liệu Premium / Plus
            </span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalPremium}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Yêu cầu tài khoản trả phí Plus / Pro
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Khung CEFR
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            A1 - C2
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân cấp độ chuẩn quốc tế cho AI Coach
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, danh mục, từ khóa..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </span>

          {/* Type Dropdown */}
          <FilterSelect
            value={selectedType}
            onChange={(val) => setSelectedType(String(val))}
            options={RESOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            label="Loại"
          />

          {/* CEFR Level Dropdown */}
          <FilterSelect
            value={selectedLevel}
            onChange={(val) => setSelectedLevel(String(val))}
            options={CEFR_LEVELS.map((lvl) => ({
              value: lvl,
              label: lvl === 'ALL' ? 'Tất cả cấp độ' : lvl,
            }))}
            label="Level"
          />

          {/* Required Plan */}
          <FilterSelect
            value={selectedPlan}
            onChange={(val) => setSelectedPlan(String(val))}
            options={REQUIRED_PLANS.map((p) => ({
              value: p,
              label: p === 'ALL' ? 'Tất cả gói' : p,
            }))}
            label="Gói"
          />

          {/* Status */}
          <FilterSelect
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(String(val))}
            options={STATUSES.map((s) => ({
              value: s,
              label: s === 'ALL' ? 'Tất cả trạng thái' : s,
            }))}
            label="Status"
          />

          {(selectedType !== 'ALL' || selectedLevel !== 'ALL' || selectedPlan !== 'ALL' || selectedStatus !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedLevel('ALL');
                setSelectedPlan('ALL');
                setSelectedStatus('ALL');
                setSearch('');
              }}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Đặt lại lọc
            </button>
          )}
        </div>
      </div>

      {/* Resources Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-violet-500" />
          <p className="text-sm">Đang tải danh sách học liệu...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
            Chưa có tài nguyên nào phù hợp
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc nhấn nút "Thêm Tài Nguyên Mới".
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-black">
                <th className="p-4">Tài nguyên & Danh mục</th>
                <th className="p-4">Loại học liệu</th>
                <th className="p-4 text-center">Khung CEFR</th>
                <th className="p-4 text-center">Yêu cầu gói</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {resources.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Title & Description */}
                  <td className="p-4 max-w-sm">
                    <div className="flex items-start gap-2.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description || item.content.slice(0, 80)}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.category || 'General'}
                          </span>
                          {item.tags?.slice(0, 2).map((tg, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-400"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                      {item.type}
                    </span>
                  </td>

                  {/* CEFR Level */}
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black border ${
                        LEVEL_COLORS[item.level] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.level}
                    </span>
                  </td>

                  {/* Required Plan */}
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.requiredPlan === 'PRO'
                          ? 'bg-indigo-600 text-white'
                          : item.requiredPlan === 'PLUS'
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.requiredPlan}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-4 text-center">
                    <FilterSelect
                      value={item.status}
                      onChange={(val) => handleStatusChange(item, String(val))}
                      options={[
                        { value: 'PUBLISHED', label: 'PUBLISHED' },
                        { value: 'DRAFT', label: 'DRAFT' },
                        { value: 'ARCHIVED', label: 'ARCHIVED' },
                      ]}
                      size="xs"
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPreviewModal(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Xem trước (Preview)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Chỉnh sửa tài nguyên"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(item)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa tài nguyên"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} mục)
              </div>
              <div className="flex gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchResources(pagination.page - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchResources(pagination.page + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT RESOURCE MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {activeResource ? `Chỉnh sửa: ${activeResource.title}` : 'Thêm Học Liệu Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý nội dung học tập, Markdown và phân cấp độ chuẩn CEFR
                </p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveResource} className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4 text-xs">
              {/* Row 1: Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tiêu Đề Học Liệu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Inversion in Advanced Grammar..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Loại Tài Nguyên *"
                    value={formData.type}
                    onChange={(val) => setFormData({ ...formData, type: String(val) })}
                    options={RESOURCE_TYPES.filter((t) => t.value !== 'ALL').map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                    size="sm"
                  />
                </div>
              </div>

              {/* Row 2: CEFR, Category, Plan, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <CustomSelect
                    label="CEFR Level"
                    value={formData.level}
                    onChange={(val) => setFormData({ ...formData, level: String(val) })}
                    options={CEFR_LEVELS.filter((l) => l !== 'ALL').map((lvl) => ({
                      value: lvl,
                      label: lvl,
                    }))}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Danh Mục (Category)
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Business, Grammar..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Yêu Cầu Gói"
                    value={formData.requiredPlan}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        requiredPlan: String(val),
                        isPremium: val !== 'FREE',
                      })
                    }
                    options={[
                      { value: 'FREE', label: 'FREE (Miễn phí)' },
                      { value: 'PLUS', label: 'PLUS' },
                      { value: 'PRO', label: 'PRO' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Trạng Thái"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val as any })}
                    options={[
                      { value: 'PUBLISHED', label: 'PUBLISHED' },
                      { value: 'DRAFT', label: 'DRAFT' },
                      { value: 'ARCHIVED', label: 'ARCHIVED' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mô Tả Ngắn (Summary)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả tóm tắt nội dung học tập..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              {/* Row 4: Markdown Content */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nội Dung Học Tập (Markdown / Text) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Viết nội dung dạng Markdown (# Tiêu đề, - gạch đầu dòng, **in đậm**...)"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Row 5: Media URLs & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Image URL (Ảnh minh họa)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Audio URL (File âm thanh nếu có)
                  </label>
                  <input
                    type="url"
                    value={formData.audioUrl}
                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                    placeholder="https://cdn.example.com/audio.mp3"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tags (Phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                    placeholder="Business, Inversion, TOEIC..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-[11px]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{activeResource ? 'Cập Nhật' : 'Tạo Học Liệu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && activeResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {activeResource.type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                    LEVEL_COLORS[activeResource.level] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeResource.level}
                </span>
                {activeResource.requiredPlan !== 'FREE' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {activeResource.requiredPlan} Only
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto pr-2 space-y-4">
              {activeResource.imageUrl && (
                <img
                  src={activeResource.imageUrl}
                  alt=""
                  className="w-full h-48 object-cover rounded-2xl border border-slate-100 dark:border-slate-800"
                />
              )}

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeResource.title}
              </h2>

              {activeResource.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {activeResource.description}
                </p>
              )}

              {/* Markdown Content Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {activeResource.content}
              </div>

              {activeResource.audioUrl && (
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    <Headphones className="w-4 h-4" />
                    <span>File âm thanh đính kèm</span>
                  </div>
                  <audio controls src={activeResource.audioUrl} className="h-8 max-w-[200px]" />
                </div>
              )}

              {activeResource.tags && activeResource.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {activeResource.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
