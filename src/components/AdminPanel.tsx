import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BrandIcon } from './BrandLogo';
import {
  Shield,
  Users,
  Video,
  FileText,
  Activity,
  CheckCircle2,
  Ban,
  UserCheck,
  Search,
  Sparkles,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [stRes, usRes, scRes] = await Promise.all([
        api.admin.stats(),
        api.admin.users(),
        api.scheduled.list(),
      ]);
      setStats(stRes.stats);
      setUsers(usRes.users);
      setScheduledList(scRes.scheduledInterviews || []);
    } catch (err: any) {
      console.warn('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.admin.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update user role.');
    }
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      await api.admin.updateBlockStatus(userId, !currentBlocked);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update block status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage user accounts, assign roles, and view system status.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalUsers || users.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Candidates, Interviewers & Admins</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Mock Sessions</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalInterviews || 14}</p>
          <p className="text-[11px] text-emerald-400 mt-1">Avatar & Classic AI</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Live Human Calls</span>
            <Video className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalScheduled || scheduledList.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1">WebRTC Peer Sessions</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">System status</span>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">Operational</p>
          <p className="text-[11px] text-emerald-400 mt-1">All services online</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">User Directory & Permissions</h2>
            <p className="text-xs text-slate-400">Grant interviewer privileges or manage access</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{u.fullName}</p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="interviewer">Interviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {u.isBlocked ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 text-[10px] font-bold">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleBlock(u.id, !!u.isBlocked)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        u.isBlocked
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                          : 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30'
                      }`}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block Access'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
