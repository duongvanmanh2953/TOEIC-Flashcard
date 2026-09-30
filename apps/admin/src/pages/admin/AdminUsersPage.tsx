import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  Award,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Mail,
  AlertCircle,
  UserCheck,
  UserX,
  X,
  Flame,
  Zap,
  Calendar,
  Save,
  Check,
  Lock,
  Copy,
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { useTranslation } from '../../i18n';
import {
  AdminButton,
  AdminFilterBar,
  AdminTable,
  AdminDrawer,
  AdminCheckbox,
  AdminSelect,
  Column,
  MoreActionsDropdown,
} from '../../components/admin/ui';

export interface PermissionItem {
  id: string;
  category: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'SYSTEM';
  label: string;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionItem[] = [
  {
    id: 'MANAGE_USERS',
    category: 'CORE',
    label: 'Quản Lý Tài Khoản & Học Viên (MANAGE_USERS)',
    description: 'Khóa/mở khóa tài khoản, phân quyền và nâng hạ vai trò quản trị.',
  },
  {
    id: 'MANAGE_GAMES',
    category: 'OPERATIONS',
    label: 'Quản Lý Game & Phòng Đấu (MANAGE_GAMES)',
    description: 'Cấu hình tựa game, mở sảnh thi đấu và bộ câu hỏi trắc nghiệm.',
  },
  {
    id: 'MANAGE_FINANCE',
    category: 'FINANCE',
    label: 'Quản Lý Giao Dịch & Hoàn Tiền (MANAGE_FINANCE)',
    description: 'Kiểm tra giao dịch ngân hàng VietQR/PayOS, duyệt kích hoạt gói Pro.',
  },
  {
    id: 'VIEW_FINANCIAL_REPORTS',
    category: 'FINANCE',
    label: 'Xem Báo Cáo Tài Chính & Dòng Tiền (VIEW_FINANCIAL_REPORTS)',
    description: 'Truy cập sổ cái P&L, bóc tách chi phí và phân tích ROI theo game.',
  },
  {
    id: 'SMART_PRICING',
    category: 'FINANCE',
    label: 'Chiến Lược Giá Động & Khuyến Mãi (SMART_PRICING)',
    description: 'Quản lý thuật toán định giá thông minh, mã voucher và bảng giá gói.',
  },
  {
    id: 'MANAGE_VOCABULARY',
    category: 'OPERATIONS',
    label: 'Quản Lý Kho Từ Vựng & Bộ Thẻ (MANAGE_VOCABULARY)',
    description: 'Chỉnh sửa định nghĩa từ vựng TOEIC, phát âm IPA và thuật toán SRS.',
  },
  {
    id: 'MANAGE_AI_CONFIG',
    category: 'SYSTEM',
    label: 'Cấu Hình Trợ Lý AI & Token LLM (MANAGE_AI_CONFIG)',
    description: 'Điều chỉnh prompt sư phạm AI, API key Gemini/OpenAI và hạn mức token.',
  },
  {
    id: 'SUPPORT_AGENT',
    category: 'OPERATIONS',
    label: 'Trực Kênh CSKH & Xử Lý Ticket (SUPPORT_AGENT)',
    description: 'Tiếp nhận chat hỗ trợ học viên realtime và xử lý yêu cầu kỹ thuật.',
  },
  {
    id: 'MODERATE_COMMUNITY',
    category: 'CORE',
    label: 'Kiểm Duyệt Cộng Đồng & Báo Lỗi (MODERATE_COMMUNITY)',
    description: 'Duyệt bộ từ đóng góp của học viên, kiểm tra báo cáo lỗi sai nghĩa.',
  },
  {
    id: 'MANAGE_SYSTEM',
    category: 'SYSTEM',
    label: 'Cấu Hình Hệ Thống & Bảo Trì (MANAGE_SYSTEM)',
    description: 'Bật/tắt bảo trì hệ thống, quản lý cache Redis và cấu hình chung.',
  },
];

const ROLE_DEFAULTS: Record<string, string[]> = {
  USER: [],
  PREMIUM_USER: [],
  MODERATOR: ['MODERATE_COMMUNITY', 'SUPPORT_AGENT'],
  ADMIN: SYSTEM_PERMISSIONS.map((p) => p.id),
  SUPER_ADMIN: SYSTEM_PERMISSIONS.map((p) => p.id),
};

interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  tier: string;
  status: string;
  streakDays: number;
  totalXp: number;
  createdAt: string;
  lastActive: string | null;
  permissions?: string[];
}

export const AdminUsersPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Granular Permission Matrix Editing State
  const [editRole, setEditRole] = useState<string>('USER');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          limit: 50,
        },
      });

      const extracted = extractApiList<any>(res);
      const mapped: UserRow[] = (extracted.items || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.displayName || u.fullName || u.email.split('@')[0],
        role: u.role || 'USER',
        tier: u.subscriptions?.[0]?.plan?.tier || (u.role === 'PREMIUM_USER' ? 'PREMIUM' : 'FREE'),
        status: u.status || 'ACTIVE',
        streakDays: u.streak?.currentStreak || 0,
        totalXp: u.xp?.totalXP || 0,
        createdAt: u.createdAt,
        lastActive: u.lastActiveAt,
        permissions: u.permissions || ROLE_DEFAULTS[u.role] || [],
      }));

      setUsers(mapped);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(locale === 'vi' ? 'Không thể tải danh sách học viên.' : 'Unable to load users list.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, locale]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: UserRow) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/status`);
      const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err) {
      console.error('Toggle user status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUserDrawer = (user: UserRow) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions || ROLE_DEFAULTS[user.role] || []);
    setSaveSuccess(false);
    setDrawerOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    setEditPermissions(SYSTEM_PERMISSIONS.map((p) => p.id));
  };

  const handleDeselectAllPermissions = () => {
    setEditPermissions([]);
  };

  const handleApplyRoleDefaults = () => {
    setEditPermissions(ROLE_DEFAULTS[editRole] || []);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${selectedUser.id}/permissions`, {
        role: editRole,
        permissions: editPermissions,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: editRole, permissions: editPermissions } : u
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, role: editRole, permissions: editPermissions } : null
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side filtering
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (tierFilter !== 'ALL' && u.tier !== tierFilter) return false;
    return true;
  });

  const columns: Column<UserRow>[] = [
    {
      key: 'fullName',
      header: 'Học Viên',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
            {u.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.fullName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{u.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai Trò & Phân Quyền',
      render: (u) => {
        const permCount = u.permissions?.length || 0;
        return (
          <div className="flex flex-col gap-1 items-start">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                  ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                  : u.role === 'MODERATOR'
                  ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'
                  : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
              }`}
            >
              {u.role}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {permCount > 0 ? `${permCount} quyền tùy biến` : 'Quyền mặc định'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'tier',
      header: 'Gói Cước',
      render: (u) =>
        u.tier === 'PREMIUM' || u.tier === 'PRO' ? (
          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold">
            PRO
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold">
            FREE
          </span>
        ),
    },
    {
      key: 'totalXp',
      header: 'Tiến Độ & XP',
      render: (u) => (
        <div className="tabular-nums">
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
            <Zap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            <span>{u.totalXp.toLocaleString()} XP</span>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5 mt-0.5">
            <Flame className="w-3 h-3" />
            <span>{u.streakDays} ngày streak</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (u) =>
        u.status === 'ACTIVE' ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Hoạt động</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Tạm khóa</span>
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày Tham Gia',
      render: (u) => (
        <span className="text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => handleOpenUserDrawer(u)}
          >
            Phân Quyền
          </AdminButton>
          <MoreActionsDropdown
            align="right"
            size="sm"
            tooltip="Tùy chọn thao tác tài khoản"
            items={[
              {
                label: 'Cấu hình phân quyền',
                icon: <Shield className="w-4 h-4 text-indigo-500" />,
                onClick: () => handleOpenUserDrawer(u),
              },
              {
                label: u.status === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Kích hoạt lại tài khoản',
                icon: u.status === 'ACTIVE' ? <XCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />,
                variant: u.status === 'ACTIVE' ? 'danger' : 'success',
                onClick: () => handleToggleStatus(u),
              },
              {
                label: 'Sao chép Email',
                icon: <Copy className="w-4 h-4 text-slate-400" />,
                onClick: () => {
                  navigator.clipboard.writeText(u.email);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-200 dark:border-indigo-500/20">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>User Directory & Permissions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Quản Lý Tài Khoản & Phân Quyền Chi Tiết
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Danh sách toàn bộ tài khoản học viên, kiểm soát ma trận quyền năng từng phân hệ.
          </p>
        </div>

        <AdminButton
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchUsers}
        >
          Làm Mới
        </AdminButton>
      </div>

      {/* Universal Filter Bar */}
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm theo email, tên học viên..."
        filters={[
          {
            key: 'role',
            label: 'Vai Trò',
            value: roleFilter,
            options: [
              { value: 'ALL', label: 'Tất Cả Vai Trò' },
              { value: 'USER', label: 'USER (Học viên)' },
              { value: 'PREMIUM_USER', label: 'PREMIUM (Học viên Pro)' },
              { value: 'MODERATOR', label: 'MODERATOR (Kiểm duyệt viên)' },
              { value: 'ADMIN', label: 'ADMIN (Quản trị viên)' },
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Toàn quyền)' },
            ],
            onChange: (val) => setRoleFilter(val),
          },
          {
            key: 'tier',
            label: 'Gói Cước',
            value: tierFilter,
            options: [
              { value: 'ALL', label: 'Tất Cả Gói' },
              { value: 'FREE', label: 'Gói Miễn Phí (Free)' },
              { value: 'PREMIUM', label: 'Gói Trả Phí (Pro)' },
            ],
            onChange: (val) => setTierFilter(val),
          },
        ]}
        onReset={() => {
          setSearch('');
          setRoleFilter('ALL');
          setTierFilter('ALL');
        }}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <AdminButton variant="secondary" size="sm" onClick={fetchUsers}>
            Thử lại
          </AdminButton>
        </div>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="Không tìm thấy học viên nào phù hợp với bộ lọc"
      />

      {/* User Details & Granular Permission Matrix Drawer */}
      {selectedUser && (
        <AdminDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Thông Tin & Phân Quyền Tài Khoản"
          subtitle={selectedUser.email}
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <AdminButton
                variant={selectedUser.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                size="sm"
                loading={actionLoading}
                onClick={() => handleToggleStatus(selectedUser)}
              >
                {selectedUser.status === 'ACTIVE' ? 'Khóa Tài Khoản' : 'Mở Khóa Tài Khoản'}
              </AdminButton>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" />
                    Đã lưu thành công!
                  </span>
                )}
                <AdminButton
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  icon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSavePermissions}
                >
                  Lưu Quyền Hạn Chi Tiết
                </AdminButton>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold text-lg flex items-center justify-center shrink-0">
                {selectedUser.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{selectedUser.fullName}</h4>
                <p className="text-slate-500 dark:text-slate-400 truncate">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-500/30">
                    {selectedUser.role}
                  </span>
                  <span className="px-2 py-0.2 rounded bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-500/30">
                    {selectedUser.tier}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Tổng Điểm XP</span>
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {selectedUser.totalXp.toLocaleString()} XP
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Chuỗi Học (Streak)</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {selectedUser.streakDays} ngày
                </span>
              </div>
            </div>

            {/* Role Selection Dropdown */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Vai Trò Hệ Thống (System Role)</span>
              </label>
              <AdminSelect
                value={editRole}
                onChange={(val) => {
                  setEditRole(val);
                }}
                options={[
                  { value: 'USER', label: 'USER (Học viên tiêu chuẩn)' },
                  { value: 'PREMIUM_USER', label: 'PREMIUM_USER (Học viên gói Pro)' },
                  { value: 'MODERATOR', label: 'MODERATOR (Kiểm duyệt viên cộng đồng)' },
                  { value: 'ADMIN', label: 'ADMIN (Quản trị viên vận hành)' },
                  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Toàn quyền hệ thống)' },
                ]}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Vai trò định danh cấp quyền cơ bản. Bạn có thể chọn từng quyền hạn tùy biến bên dưới.
              </p>
            </div>

            {/* Granular Permission Matrix with Checkboxes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Ma Trận Quyền Năng Chi Tiết ({editPermissions.length}/{SYSTEM_PERMISSIONS.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Đánh dấu checkbox để kích hoạt từng tính năng cụ thể cho tài khoản
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
                  >
                    Chọn Tất Cả
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllPermissions}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Bỏ Chọn
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyRoleDefaults}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Theo Vai Trò
                  </button>
                </div>
              </div>

              {/* Permission Checkbox List */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {SYSTEM_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/40'
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <AdminCheckbox
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                            {perm.label}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                            perm.category === 'CORE'
                              ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                              : perm.category === 'OPERATIONS'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : perm.category === 'FINANCE'
                              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                          }`}>
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration & Activity Timestamps */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Trạng Thái:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedUser.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Ngày Đăng Ký:</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                  {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Hoạt Động Lần Cuối:</span>
                <span className="text-slate-800 dark:text-slate-200 tabular-nums">
                  {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString('vi-VN') : 'Chưa ghi nhận'}
                </span>
              </div>
            </div>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
};
