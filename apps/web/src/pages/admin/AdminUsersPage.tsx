import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Shield, Award, CheckCircle, 
  XCircle, MoreHorizontal, ArrowUpDown, Download, Mail, RefreshCw
} from 'lucide-react';
import api from '../../lib/api';

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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.email.toLowerCase().includes(search.toLowerCase()) || 
      (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesTier = tierFilter === 'ALL' || u.tier === tierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-500" />
            User & Account Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student & pro accounts, monitor engagement, roles and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Registered</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">PRO / Enterprise</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {users.filter(u => u.tier === 'PRO' || u.tier === 'PREMIUM_USER').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Admin & Staff</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Active Streaks (&gt;3d)</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {users.filter(u => (u.streakDays || 0) >= 3).length}
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">Standard User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="FREE">Free</option>
            <option value="PRO">PRO</option>
            <option value="PREMIUM_USER">Premium User</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">XP / Streak</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                          {u.fullName ? u.fullName[0] : u.email[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {u.fullName || 'Nameless Learner'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Shield className="w-3 h-3" /> Super Admin
                        </span>
                      ) : u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 dark:text-slate-400">Member</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.tier === 'PRO' || u.tier === 'PREMIUM_USER' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Award className="w-3 h-3" /> PRO
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {u.totalXp?.toLocaleString() || 0} XP
                      </div>
                      <div className="text-xs text-amber-500 font-medium">
                        🔥 {u.streakDays || 0} days
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">User Profile</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400">Email</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Full Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedUser.fullName || 'None'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Role</span>
                  <p className="font-semibold text-indigo-500">{selectedUser.role}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Subscription Tier</span>
                  <p className="font-semibold text-emerald-500">{selectedUser.tier}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Total XP</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.totalXp} XP</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Streak</span>
                  <p className="font-semibold text-amber-500">🔥 {selectedUser.streakDays} days</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUsersPage;
