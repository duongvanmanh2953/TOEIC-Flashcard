import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Users, Sparkles, CheckCircle2, History, 
  AlertCircle, Info, Gift, Zap, ShieldAlert, RefreshCw
} from 'lucide-react';
import api from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  author?: {
    email: string;
  };
}

export const AdminNotificationsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [type, setType] = useState('INFO');
  const [actionUrl, setActionUrl] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/announcements');
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSending(true);
    setSuccessMsg('');

    try {
      const res = await api.post('/notifications/broadcast', {
        title,
        message: content,
        type,
        targetAudience,
        data: actionUrl ? { link: actionUrl } : undefined,
      });

      setSuccessMsg(`Broadcast sent to ${res.data?.count || 'all targeted'} users!`);
      setTitle('');
      setContent('');
      setActionUrl('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-500" />
            Broadcast Notification Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch announcements, system alerts, and cohort promotions across the entire platform
          </p>
        </div>
        <button 
          onClick={fetchAnnouncements} 
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Composer & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Composer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-500" />
            Compose System Notification
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Users (Global Broadcast)</option>
                  <option value="FREE">Free Tier Users (Upsell / Feature Promo)</option>
                  <option value="PREMIUM">PRO / Premium Users Only</option>
                  <option value="INACTIVE_7D">Inactive (&gt; 7 days streak broken)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category / Urgency
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INFO">General Information</option>
                  <option value="UPDATE">Product Feature Update</option>
                  <option value="PROMOTION">Promotional / Special Offer</option>
                  <option value="SYSTEM">System Maintenance / Notice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Notification Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., FSRS 4.5 Algorithm is now live for all flashcards!"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Notification Content / Body
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write detailed announcement text..."
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Deep-link Action URL (Optional)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="e.g., /subscription or /decks/toeic-900"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Dispatching Broadcast...' : 'Broadcast to Users'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            User In-App Preview
          </h3>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-md space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                {type === 'PROMOTION' ? <Gift className="w-4 h-4" /> : 
                 type === 'SYSTEM' ? <ShieldAlert className="w-4 h-4" /> : 
                 <Info className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {type} • Just now
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {title || 'Announcement Title'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {content || 'Your notification content will appear here exactly as learners see it in their notification feed.'}
                </p>
                {actionUrl && (
                  <span className="inline-block mt-2 text-xs font-semibold text-indigo-500 underline">
                    View update →
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Audience Targeting:</p>
            <p>Target: <span className="font-mono text-indigo-600">{targetAudience}</span></p>
            <p>Delivery: Realtime WebSocket + In-app Bell Notification Store</p>
          </div>
        </div>
      </div>

      {/* Past Announcements History */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Broadcast Dispatch History
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Loading broadcast history...
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No previous broadcasts found.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{a.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {a.targetRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.content}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminNotificationsPage;
