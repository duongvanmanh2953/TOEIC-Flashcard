import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Shield,
  Search,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import api from '../../lib/api';
import { confirmModal } from '../common/ConfirmDialog';

interface AccessGrant {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  lastUsedAt?: string;
}

interface AccessKeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankType: 'VOCABULARY' | 'EXAM';
  bankId: string;
  bankTitle: string;
  isProtected?: boolean;
  onOpenChatWithUser?: (userId: string, userName: string) => void;
}

export const AccessKeyManagementModal: React.FC<AccessKeyManagementModalProps> = ({
  isOpen,
  onClose,
  bankType,
  bankId,
  bankTitle,
  isProtected,
  onOpenChatWithUser,
}) => {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Newly generated key modal state
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Confirmation for regenerating key
  const [confirmRegenerateUser, setConfirmRegenerateUser] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGrants();
    } else {
      resetForm();
    }
  }, [isOpen, bankId]);

  const resetForm = () => {
    setIsCreating(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setErrorMessage('');
    setGeneratedKey(null);
    setCopied(false);
    setConfirmRegenerateUser(null);
  };

  const loadGrants = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/community/access-keys/grants', {
        params: { bankType, bankId },
      });
      if (res?.data) {
        setGrants(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load access grants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res: any = await api.get('/community/access-keys/search-users', {
          params: { q: searchQuery },
        });
        if (res?.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Submit creation / regeneration
  const handleCreateKey = async (forceRegenerate = false) => {
    if (!selectedUser) {
      setErrorMessage('Vui lòng chọn học viên cần cấp quyền');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await api.post('/community/access-keys', {
        bankType,
        bankId,
        targetUserId: selectedUser.id,
        forceRegenerate,
      });

      if (res?.data?.alreadyHasKey && !forceRegenerate) {
        setConfirmRegenerateUser(selectedUser);
        return;
      }

      if (res?.data?.accessKey) {
        setGeneratedKey(res.data.accessKey);
        setConfirmRegenerateUser(null);
        await loadGrants();
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo mã truy cập',
      );
    } finally {
      setLoading(false);
    }
  };

  // Revoke grant
  const handleRevoke = async (grantId: string) => {
    const ok = await confirmModal({
      title: 'Thu hồi quyền truy cập',
      message: 'Bạn có chắc chắn muốn thu hồi quyền truy cập của người dùng này? Người này sẽ không thể tiếp tục truy cập bộ kho này.',
      type: 'danger',
      confirmText: 'Thu hồi quyền',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    try {
      await api.delete(`/community/access-keys/grants/${grantId}`);
      await loadGrants();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể thu hồi quyền');
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Quản lý quyền truy cập
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {bankType === 'VOCABULARY' ? '📚 Kho từ:' : '📝 Đề thi:'} {bankTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Successfully Generated Banner */}
          {generatedKey && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-slide-down">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Check className="w-4 h-4" />
                Mã Access Key đã được tạo thành công!
              </div>
              <p className="text-xs text-slate-300">
                Hãy sao chép mã và gửi cho học viên. Mã này chỉ hiển thị một lần duy nhất vì lý do bảo mật.
              </p>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-sm text-emerald-400 select-all">
                <span className="flex-1 break-all">{generatedKey}</span>
                <button
                  onClick={handleCopyKey}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
                {selectedUser && onOpenChatWithUser && (
                  <button
                    onClick={() => {
                      onOpenChatWithUser(selectedUser.id, selectedUser.displayName);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Nhắn tin cho học viên
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Confirm Regenerate Dialog */}
          {confirmRegenerateUser && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                Xác nhận tạo lại mã Access Key
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Học viên <strong>{confirmRegenerateUser.displayName}</strong> hiện đã có mã Access Key hoạt động. Tạo key mới sẽ lập tức vô hiệu hóa mã cũ. Bạn có chắc chắn muốn tiếp tục?
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmRegenerateUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateKey(true)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium transition flex items-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Tạo key mới & Vô hiệu key cũ
                </button>
              </div>
            </div>
          )}

          {/* Action Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Danh sách được cấp quyền ({grants.length})
            </span>
            {!isCreating && (
              <button
                onClick={() => {
                  setIsCreating(true);
                  setGeneratedKey(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Cấp quyền mới
              </button>
            )}
          </div>

          {/* Create Access Key Form */}
          {isCreating && (
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Tạo mã Access Key cho học viên
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Đóng
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* User Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Chọn học viên (Tìm theo Tên hoặc Email):
                </label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800 border border-indigo-500/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                        {selectedUser.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {selectedUser.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400">{selectedUser.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-slate-400 hover:text-red-400 px-2 py-1"
                    >
                      Đổi người khác
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nhập tên hoặc email học viên..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      {isSearching && (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 divide-y divide-slate-800">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center gap-2.5 transition"
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                              {user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-white truncate">
                                {user.displayName}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateKey(false)}
                  disabled={loading || !selectedUser}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition flex items-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Tạo Access Key
                </button>
              </div>
            </div>
          )}

          {/* Grants Table / List */}
          <div className="space-y-2">
            {loading && !grants.length ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Đang tải danh sách quyền...
              </div>
            ) : grants.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                Chưa có học viên nào được cấp quyền truy cập riêng cho kho này.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-800/30 border border-slate-800 overflow-hidden">
                {grants.map((grant) => {
                  const isActive = grant.status === 'ACTIVE';
                  return (
                    <div
                      key={grant.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                          {grant.user?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white flex items-center gap-2 truncate">
                            {grant.user?.displayName || 'Học viên'}
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {isActive ? 'Hoạt động' : 'Đã thu hồi'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {grant.user?.email} • Cấp ngày: {new Date(grant.createdAt).toLocaleDateString('vi-VN')}
                            {grant.lastUsedAt && ` • Dùng lúc: ${new Date(grant.lastUsedAt).toLocaleDateString('vi-VN')}`}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {onOpenChatWithUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenChatWithUser(grant.userId, grant.user?.displayName);
                              onClose();
                            }}
                            title="Nhắn tin"
                            className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(grant.id)}
                            title="Thu hồi quyền"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
