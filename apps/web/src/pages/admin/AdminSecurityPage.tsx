import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Key, AlertTriangle, UserCheck, 
  FileText, ShieldAlert, CheckCircle2, RefreshCw
} from 'lucide-react';

export const AdminSecurityPage: React.FC = () => {
  const [logs] = useState([
    { id: 1, action: 'ADMIN_LOGIN', user: 'admin@vocabflow.ai', ip: '127.0.0.1', timestamp: '2 minutes ago', status: 'SUCCESS' },
    { id: 2, action: 'BROADCAST_SENT', user: 'admin@vocabflow.ai', ip: '127.0.0.1', timestamp: '15 minutes ago', status: 'SUCCESS' },
    { id: 3, action: 'PROMOTION_TIER_UPDATE', user: 'system', ip: 'internal', timestamp: '1 hour ago', status: 'SUCCESS' },
    { id: 4, action: 'FAILED_LOGIN_ATTEMPT', user: 'unknown@test.com', ip: '14.232.18.9', timestamp: '3 hours ago', status: 'BLOCKED' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          Security, Audit Logs & RBAC Matrix
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Access control policies, administrative activity audit trail, and rate protection
        </p>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            Role-Based Access Control (RBAC) Matrix
          </h3>
          <span className="text-xs text-slate-400">Strict server-side JWT verification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-500">
                <th className="py-3 px-4">Permission Module</th>
                <th className="py-3 px-4 text-center">STUDENT / FREE</th>
                <th className="py-3 px-4 text-center">PRO SUBSCRIBER</th>
                <th className="py-3 px-4 text-center">ADMIN</th>
                <th className="py-3 px-4 text-center">SUPER_ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {[
                { name: 'Vocabulary & FSRS Flashcards', free: true, pro: true, admin: true, super: true },
                { name: 'Unlimited AI Tutor & Roleplay', free: false, pro: true, admin: true, super: true },
                { name: 'Full TOEIC Exam Simulation', free: false, pro: true, admin: true, super: true },
                { name: 'Customer Support Helpdesk', free: true, pro: true, admin: true, super: true },
                { name: 'Product Feedback & Voting', free: true, pro: true, admin: true, super: true },
                { name: 'Admin Command Center (/admin)', free: false, free_note: '403 Forbidden', pro: false, admin: true, super: true },
                { name: 'User Role Promotion & Demotion', free: false, pro: false, admin: false, super: true },
                { name: 'Broadcast Global Notifications', free: false, pro: false, admin: true, super: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.free ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-slate-400 tabular-nums text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.pro ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-slate-400 tabular-nums text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 mx-auto" />
                    ) : (
                      <span className="text-slate-400 tabular-nums text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.super ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mx-auto" />
                    ) : (
                      <span className="text-slate-400 tabular-nums text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Administrative Audit Trail
          </h3>
          <span className="text-xs text-slate-400">Immutable log records</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded tabular-nums font-bold ${
                  log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700'
                }`}>
                  {log.action}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {log.user}
                </span>
                <span className="text-slate-400 tabular-nums">
                  IP: {log.ip}
                </span>
              </div>
              <span className="text-slate-400">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminSecurityPage;
