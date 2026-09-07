import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ThumbsUp, Filter, Search, CheckCircle2, 
  Clock, AlertCircle, Sparkles, Send, RefreshCw, LayoutGrid, List
} from 'lucide-react';
import api from '../../lib/api';

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  upvotes: number;
  adminResponse: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

export const AdminFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback/admin/all');
      setFeedbacks(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load admin feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/feedback/admin/${id}/status`, { status: newStatus });
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: newStatus } : f));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !replyText.trim()) return;

    setUpdatingStatus(true);
    try {
      await api.post(`/feedback/admin/${selectedItem.id}/respond`, {
        response: replyText,
        newStatus: selectedItem.status === 'PENDING' ? 'UNDER_REVIEW' : selectedItem.status,
      });

      setFeedbacks(feedbacks.map(f => 
        f.id === selectedItem.id ? { ...f, adminResponse: replyText } : f
      ));
      setSelectedItem({ ...selectedItem, adminResponse: replyText });
      setReplyText('');
    } catch (err) {
      console.error('Failed to post admin response:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchType = typeFilter === 'ALL' || f.type === typeFilter;
    return matchStatus && matchType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Resolved</span>;
      case 'PLANNED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Planned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">In Progress</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Under Review</span>;
      case 'DECLINED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Declined</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            Feedback & Product Roadmap
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prioritize user requests, respond publicly, and sync with roadmap milestones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={fetchFeedback} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DECLINED">Declined</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="BUG">Bug Report</option>
          <option value="VOCAB_ERROR">Vocab Error</option>
          <option value="UI_UX">UI / UX Improvement</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      {/* View Mode: List Table */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Upvotes</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading feedback submissions...
                    </td>
                  </tr>
                ) : filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No feedback matching criteria
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        setReplyText(item.adminResponse || '');
                      }}
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                          <ThumbsUp className="w-3 h-3" /> {item.upvotes}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                        {item.adminResponse && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Admin responded
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.type}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {item.user?.email || 'Anonymous'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setReplyText(item.adminResponse || '');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 rounded hover:bg-indigo-100 transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode: Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(['PENDING', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED'] as const).map(colStatus => {
            const colItems = filteredFeedbacks.filter(f => f.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {colStatus.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {colItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setReplyText(item.adminResponse || '');
                      }}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 cursor-pointer transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                          {item.type}
                        </span>
                        <span className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {item.upvotes}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Respond Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {selectedItem.type}
                </span>
                {getStatusBadge(selectedItem.status)}
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted by {selectedItem.user?.email || 'User'} • {new Date(selectedItem.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
                {selectedItem.description}
              </div>

              {/* Status change buttons */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-2">Update Status</span>
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'DECLINED'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedItem.id, st)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        selectedItem.status === st
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Response */}
              <form onSubmit={handleSendResponse} className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-500 block">
                  Official Public Response (Notifies the user)
                </span>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for this suggestion! We are scheduling this for our Q3 update..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus || !replyText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Save & Notify User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFeedbackPage;
