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
} from 'lucide-react';
import api, { extractApiList } from '../../lib/api';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { useTranslation } from '../../i18n';

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
  const [actionLoading, setActionLoading] = useState(false);

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
        setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesTier = tierFilter === 'ALL' || u.tier === tierFilter;
    return matchesRole && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-500" />
            <span>{locale === 'vi' ? 'Quản Trị Người Dùng & Học Viên' : 'User Management & Accounts'}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {locale === 'vi'
              ? 'Giám sát tài khoản, vai trò phân quyền và trạng thái học tập của học viên.'
              : 'Monitor student accounts, subscription tiers, and learning activity.'}
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700 self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      {/* Filters Strip */}
      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'vi' ? 'Tìm theo email, tên học viên...' : 'Search users by email or name...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="w-44">
          <FilterSelect
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[
              { value: 'ALL', label: locale === 'vi' ? 'Tất cả Vai trò' : 'All Roles' },
              { value: 'USER', label: 'USER (Học viên)' },
              { value: 'ADMIN', label: 'ADMIN (Quản trị viên)' },
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
            ]}
            size="sm"
          />
        </div>

        <div className="w-44">
          <FilterSelect
            value={tierFilter}
            onChange={(val) => setTierFilter(val)}
            options={[
              { value: 'ALL', label: locale === 'vi' ? 'Tất cả Gói cước' : 'All Tiers' },
              { value: 'FREE', label: 'FREE (Miễn phí)' },
              { value: 'PREMIUM', label: 'PREMIUM (Trả phí)' },
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
          >
            {locale === 'vi' ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Học viên</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Gói cước</th>
                <th className="py-3.5 px-4">Tiến độ & XP</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tham gia</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-14 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {locale === 'vi' ? 'Không tìm thấy người dùng phù hợp.' : 'No users found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          {u.role}
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-medium">USER</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.tier === 'PREMIUM' || u.tier === 'PRO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Award className="w-3 h-3" />
                          <span>PREMIUM</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          FREE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        <span>{u.totalXp.toLocaleString()} XP</span>
                      </div>
                      <div className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5 mt-0.5">
                        <Flame className="w-3 h-3" />
                        <span>{u.streakDays} ngày streak</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tạm khóa</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Hồ sơ người dùng</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Họ và tên hiển thị:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedUser.fullName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400">Vai trò:</span>
                  <p className="font-bold text-indigo-500 mt-0.5">{selectedUser.role}</p>
                </div>
                <div>
                  <span className="text-slate-400">Gói cước:</span>
                  <p className="font-bold text-emerald-500 mt-0.5">{selectedUser.tier}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tổng XP:</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedUser.totalXp.toLocaleString()} XP</p>
                </div>
                <div>
                  <span className="text-slate-400">Chuỗi ngày học:</span>
                  <p className="font-bold text-amber-500 mt-0.5">🔥 {selectedUser.streakDays} ngày</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleStatus(selectedUser)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedUser.status === 'ACTIVE'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {selectedUser.status === 'ACTIVE' ? (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Khóa tài khoản</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Kích hoạt lại</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
