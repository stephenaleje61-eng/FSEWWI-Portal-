import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Printer,
  ShieldCheck,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Database,
  Lock,
  UserCheck,
  UserX,
  Save,
  HardDrive
} from 'lucide-react';
import { AdminStats, UserRole, UserRecord, BackupRecord } from '../types.ts';
import { NIGERIA_STATES_LGAS, NIGERIAN_STATES } from '../data/nigeriaLocations.ts';
import { PrintSlipModal } from './PrintSlipModal.tsx';
import { FsewwiLogo } from './FsewwiLogo.tsx';

interface AdminPanelProps {
  userEmail: string;
  userRole: UserRole;
  onLogout: () => void;
  onBackToPortal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userEmail,
  userRole,
  onLogout,
  onBackToPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'applications' | 'backups'>('users');
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalApplicants: 0,
    pending: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    notApproved: 0,
    needsCorrection: 0,
    drafts: 0,
  });

  // Users Database State
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [usersSearch, setUsersSearch] = useState('');
  const [usersVerifFilter, setUsersVerifFilter] = useState('ALL');
  const [usersAccountFilter, setUsersAccountFilter] = useState('ALL');
  const [usersStateFilter, setUsersStateFilter] = useState('ALL');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserRecord | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [appPagination, setAppPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [appSearch, setAppSearch] = useState('');
  const [appStateFilter, setAppStateFilter] = useState('ALL');
  const [appLgaFilter, setAppLgaFilter] = useState('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
  const [selectedAppRef, setSelectedAppRef] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Backups State
  const [backupsList, setBackupsList] = useState<BackupRecord[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  // Print modal
  const [printApp, setPrintApp] = useState<any | null>(null);

  // Audit logs tab
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Role permissions
  const canApproveOrReject = ['super_admin', 'administrator', 'reviewer'].includes(userRole);
  const canManageUsers = ['super_admin', 'administrator'].includes(userRole);
  const canExportData = ['super_admin', 'administrator'].includes(userRole);
  const canCreateBackups = ['super_admin', 'administrator'].includes(userRole);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch Users Registry from PostgreSQL
  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(usersPagination.limit),
        verificationStatus: usersVerifFilter,
        accountStatus: usersAccountFilter,
        state: usersStateFilter,
        search: usersSearch,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsersList(data.items || []);
        setUsersPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Applications Registry
  const fetchApplications = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(appPagination.limit),
        status: appStatusFilter,
        state: appStateFilter,
        lga: appLgaFilter,
        search: appSearch,
      });

      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.items || []);
        setAppPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Backups
  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups');
      const data = await res.json();
      if (data.success) {
        setBackupsList(data.backups || []);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') {
      fetchUsers(1);
    } else if (activeTab === 'applications') {
      fetchApplications(1);
    } else if (activeTab === 'backups') {
      fetchBackups();
    }
  }, [activeTab, usersVerifFilter, usersAccountFilter, usersStateFilter, appStatusFilter, appStateFilter, appLgaFilter]);

  // Handle User Status & Verification Update
  const handleUpdateUserStatus = async (userId: string, verifStatus?: string, accStatus?: string) => {
    if (!canManageUsers) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: verifStatus,
          accountStatus: accStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers(usersPagination.page);
        await fetchStats();
        if (selectedUserDetail && selectedUserDetail.uid === userId) {
          setSelectedUserDetail({
            ...selectedUserDetail,
            verificationStatus: (verifStatus as any) || selectedUserDetail.verificationStatus,
            accountStatus: (accStatus as any) || selectedUserDetail.accountStatus,
          });
        }
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Edit User Submit
  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.uid}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingUser.fullName,
          phoneNumber: editingUser.phoneNumber,
          address: editingUser.address,
          state: editingUser.state,
          lga: editingUser.lga,
          widowStatus: editingUser.widowStatus,
          identificationType: editingUser.identificationType,
          identificationNumber: editingUser.identificationNumber,
          dateOfBirth: editingUser.dateOfBirth,
          gender: editingUser.gender,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        await fetchUsers(usersPagination.page);
      }
    } catch (err) {
      console.error('Error saving user edits:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create Database Backup Snapshot
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/backup/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupSuccessMsg(`Backup ${data.backupReference} generated successfully (${data.totalRecords} records preserved, SHA-256 verified).`);
        await fetchBackups();
      }
    } catch (err) {
      console.error('Backup creation error:', err);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Open Application Detail Drawer
  const handleOpenAppDetail = async (ref: string) => {
    setSelectedAppRef(ref);
    setSelectedAppDetail(null);
    setReviewNotes('');
    try {
      const res = await fetch(`/api/admin/application/${ref}`);
      const data = await res.json();
      if (data.success) {
        setSelectedAppDetail(data);
        setReviewNotes(data.application?.reviewNotes || '');
      }
    } catch (err) {
      console.error('Failed to load detail for', ref, err);
    }
  };

  // Handle Application Status Update
  const handleUpdateAppStatus = async (newStatus: 'Approved' | 'Not Approved' | 'Needs Correction' | 'Under Review') => {
    if (!selectedAppRef) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/application/${selectedAppRef}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStats();
        await fetchApplications(appPagination.page);
        if (selectedAppDetail) {
          setSelectedAppDetail({
            ...selectedAppDetail,
            application: {
              ...selectedAppDetail.application,
              status: newStatus,
              reviewNotes,
            },
          });
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-16">
      
      {/* Top Admin Bar */}
      <div className="bg-[#0b2d72] text-white border-b border-[#0f388a] py-3.5 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FsewwiLogo size="xs" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase font-serif tracking-tight">
                FSEWWI Permanent Database Administration
              </h2>
              <span className="text-[11px] text-blue-200">
                Logged in: <strong>{userEmail}</strong> &bull; Role: <strong className="uppercase text-amber-300">{userRole.replace('_', ' ')}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreateBackups && (
              <button
                onClick={() => { setActiveTab('backups'); fetchBackups(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
                  activeTab === 'backups' ? 'bg-amber-400 text-purple-950 border-amber-300' : 'bg-blue-900/60 hover:bg-blue-800 text-white border-blue-700'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>DB Backups</span>
              </button>
            )}

            {canExportData && (
              <a
                href="/api/admin/export"
                download
                className="bg-blue-900/60 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-blue-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
            )}

            <button
              onClick={() => { setShowAuditLogs(true); fetchAuditLogs(); }}
              className="bg-blue-900/60 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border border-blue-700"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={onBackToPortal}
              className="bg-[#0f388a] hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-blue-400/30"
            >
              Portal View
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* KPI Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-[#0f388a]">{(stats.totalUsers || stats.totalApplicants).toLocaleString()}</span>
              <Users className="w-4 h-4 text-[#0f388a]" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Review</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-700">{stats.pending.toLocaleString()}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Approved / Verified</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-700">{stats.approved.toLocaleString()}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Not Approved</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-700">{stats.notApproved.toLocaleString()}</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Needs Correction</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-800">{stats.needsCorrection.toLocaleString()}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Backups</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-700">{backupsList.length || '1+'}</span>
              <Database className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Primary Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'users'
                ? 'border-[#0f388a] text-[#0f388a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Permanent Users Database ({usersPagination.total.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-2 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'applications'
                ? 'border-[#0f388a] text-[#0f388a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Applications Registry ({stats.totalApplicants.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`pb-3 px-2 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'backups'
                ? 'border-[#0f388a] text-[#0f388a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backups &amp; Disaster Recovery</span>
          </button>
        </div>

        {/* TAB 1: USERS DATABASE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); fetchUsers(1); }}
                  className="flex-1 w-full flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#0f388a] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users by UID (USR-2026-...), Full Name, Email, Phone, or NIN..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#0f388a] hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    Search
                  </button>
                </form>

                <button
                  onClick={() => { fetchStats(); fetchUsers(usersPagination.page); }}
                  className="p-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-600 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Verification Status</label>
                  <select
                    value={usersVerifFilter}
                    onChange={(e) => setUsersVerifFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All Verification Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Account Status</label>
                  <select
                    value={usersAccountFilter}
                    onChange={(e) => setUsersAccountFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">State</label>
                  <select
                    value={usersStateFilter}
                    onChange={(e) => setUsersStateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All Nigerian States</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">
                  Permanent Users Table ({usersPagination.total.toLocaleString()} total records in PostgreSQL)
                </h3>
                <span className="text-xs text-slate-500">
                  Page {usersPagination.page} of {Math.max(1, usersPagination.totalPages)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f388a]" />
                          Querying permanent PostgreSQL database...
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No user records found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50/40 transition">
                          
                          {/* UID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0f388a]">
                            {u.uid}
                          </td>

                          {/* Full Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {u.fullName || u.displayName || 'Applicant'}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4">
                            <span className="block font-semibold text-slate-800">{u.phoneNumber || '—'}</span>
                            <span className="text-[10px] text-slate-500">{u.email}</span>
                          </td>

                          {/* Widow status */}
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {u.widowStatus || 'Widow'} ({u.gender || 'Female'})
                          </td>

                          {/* Verification Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              u.verificationStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              u.verificationStatus === 'Under Review' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {u.verificationStatus}
                            </span>
                          </td>

                          {/* Account Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.accountStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {u.accountStatus}
                            </span>
                          </td>

                          {/* Registered Date */}
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <button
                              onClick={() => setSelectedUserDetail(u)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f388a] rounded-lg font-bold text-xs inline-flex items-center gap-1 transition"
                              title="View Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Profile</span>
                            </button>

                            {canManageUsers && (
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition"
                                title="Edit Information"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing {usersList.length} of {usersPagination.total.toLocaleString()} users
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={usersPagination.page <= 1}
                    onClick={() => fetchUsers(usersPagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={usersPagination.page >= usersPagination.totalPages}
                    onClick={() => fetchUsers(usersPagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: APPLICATIONS REGISTRY */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <form
                onSubmit={(e) => { e.preventDefault(); fetchApplications(1); }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#0f388a] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Reference Number (e.g. FSEWWI-2026-...), Surname, Phone, or Email..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#0f388a] hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  Search
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Filter by Status</label>
                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Submitted">Submitted (New)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Not Approved">Not Approved</option>
                    <option value="Needs Correction">Needs Correction</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Filter by State</label>
                  <select
                    value={appStateFilter}
                    onChange={(e) => setAppStateFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All States</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Filter by LGA</label>
                  <select
                    value={appLgaFilter}
                    onChange={(e) => setAppLgaFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="ALL">All LGAs</option>
                    {appStateFilter !== 'ALL' && (NIGERIA_STATES_LGAS[appStateFilter] || []).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">
                  Applications Dossiers ({appPagination.total.toLocaleString()} total records)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Applicant Name</th>
                      <th className="py-3 px-4">Phone / Email</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Children</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0f388a]">{app.referenceNumber}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{app.surname ? `${app.title || ''} ${app.surname} ${app.otherNames || ''}` : 'Applicant'}</td>
                        <td className="py-3.5 px-4">
                          <span className="block font-semibold text-slate-900">{app.phoneNumber || '—'}</span>
                          <span className="text-[10px] text-slate-500">{app.email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{app.lga ? `${app.lga}, ${app.state}` : '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{app.childrenCount ?? 0}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            app.status === 'Not Approved' ? 'bg-rose-100 text-rose-800' :
                            app.status === 'Needs Correction' ? 'bg-amber-100 text-amber-800' :
                            app.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-900'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAppDetail(app.referenceNumber)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f388a] rounded-lg font-bold text-xs inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: BACKUPS & DISASTER RECOVERY */}
        {activeTab === 'backups' && (
          <div className="space-y-4">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#0f388a]" />
                  <h3 className="font-black text-base text-slate-900 uppercase">
                    Automated &amp; On-Demand PostgreSQL Backups
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-xl">
                  Snapshots capture all user profiles, application forms, audit logs, and photos into persistent storage with cryptographic SHA-256 validation. Data survives server rebuilds and redeployments.
                </p>
              </div>

              {canCreateBackups && (
                <button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="bg-[#0f388a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow transition"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{isCreatingBackup ? 'Generating Snapshot...' : 'Create Instant Backup Snapshot'}</span>
                </button>
              )}
            </div>

            {backupSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{backupSuccessMsg}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-800">Available Database Snapshots</h4>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {backupsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No manual backups logged yet. Click &ldquo;Create Instant Backup Snapshot&rdquo; to preserve database state.
                  </div>
                ) : (
                  backupsList.map((bkp) => (
                    <div key={bkp.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0f388a]">{bkp.backupReference}</span>
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {bkp.backupType}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{bkp.notes || 'Full relational snapshot'}</p>
                        {bkp.checksum && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            SHA-256: {bkp.checksum.slice(0, 32)}...
                          </span>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div className="font-semibold text-slate-800">{bkp.recordCount} Total Records</div>
                        <div>{new Date(bkp.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* User Profile Detail Drawer */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col">
            
            <div className="bg-[#0b2d72] text-white p-5 flex items-center justify-between sticky top-0 z-20">
              <div>
                <h3 className="font-black text-sm uppercase">Permanent User Dossier</h3>
                <span className="font-mono text-amber-300 text-xs font-bold">{selectedUserDetail.uid}</span>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} className="text-slate-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
                <h4 className="text-base font-black text-slate-900 uppercase">
                  {selectedUserDetail.fullName || selectedUserDetail.displayName}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Email:</strong> {selectedUserDetail.email}</div>
                  <div><strong>Phone:</strong> {selectedUserDetail.phoneNumber || '—'}</div>
                  <div><strong>Gender:</strong> {selectedUserDetail.gender || '—'}</div>
                  <div><strong>Status:</strong> {selectedUserDetail.widowStatus || 'Widow'}</div>
                  <div><strong>Location:</strong> {selectedUserDetail.lga}, {selectedUserDetail.state}</div>
                  <div><strong>DOB:</strong> {selectedUserDetail.dateOfBirth || '—'}</div>
                  <div className="col-span-2"><strong>Address:</strong> {selectedUserDetail.address || '—'}</div>
                  <div className="col-span-2">
                    <strong>ID Document:</strong> {selectedUserDetail.identificationType} &bull; {selectedUserDetail.identificationNumber || 'On file'}
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Verification Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                    selectedUserDetail.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                    selectedUserDetail.verificationStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedUserDetail.verificationStatus}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Account Standing</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                    selectedUserDetail.accountStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {selectedUserDetail.accountStatus}
                  </span>
                </div>
              </div>

              {/* Administrative Actions */}
              {canManageUsers && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h5 className="font-bold uppercase tracking-wider text-[11px] text-slate-700">Administrator Actions</h5>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedUserDetail.verificationStatus !== 'Verified' && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateUserStatus(selectedUserDetail.uid, 'Verified')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Verify Registration</span>
                      </button>
                    )}

                    {selectedUserDetail.verificationStatus !== 'Rejected' && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateUserStatus(selectedUserDetail.uid, 'Rejected')}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Reject Registration</span>
                      </button>
                    )}

                    {selectedUserDetail.accountStatus === 'Active' ? (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateUserStatus(selectedUserDetail.uid, undefined, 'Suspended')}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Suspend Account</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateUserStatus(selectedUserDetail.uid, undefined, 'Active')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Reactivate Account</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 uppercase">Edit Permitted User Information</h4>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdits} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Widow/Widower Status</label>
                  <select
                    value={editingUser.widowStatus || 'Widow'}
                    onChange={(e) => setEditingUser({ ...editingUser, widowStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Widow">Widow</option>
                    <option value="Widower">Widower</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">State</label>
                  <select
                    value={editingUser.state || 'Benue'}
                    onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">LGA</label>
                  <input
                    type="text"
                    value={editingUser.lga || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lga: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Address</label>
                <input
                  type="text"
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-lg bg-[#0f388a] text-white font-bold"
                >
                  Save Changes to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Review Drawer */}
      {selectedAppRef && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto flex flex-col">
            <div className="bg-[#0b2d72] text-white p-5 flex items-center justify-between sticky top-0 z-20">
              <div>
                <h3 className="font-black text-sm uppercase">Application Review Dossier</h3>
                <span className="font-mono text-amber-300 text-xs font-bold">{selectedAppRef}</span>
              </div>
              <button onClick={() => setSelectedAppRef(null)} className="text-slate-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              {selectedAppDetail && (
                <>
                  <div className="flex items-start gap-4 p-4 bg-blue-50/80 rounded-2xl border border-blue-200">
                    <div className="w-24 h-28 rounded-xl border-2 border-blue-300 overflow-hidden bg-slate-200 shrink-0 shadow">
                      {selectedAppDetail.photo?.photoStorageUrl ? (
                        <img src={selectedAppDetail.photo.photoStorageUrl} alt="Passport" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Photo</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-base font-black text-slate-900 uppercase">
                        {selectedAppDetail.applicant?.title} {selectedAppDetail.applicant?.surname} {selectedAppDetail.applicant?.otherNames}
                      </h4>
                      <p>Email: <strong>{selectedAppDetail.user?.email}</strong></p>
                      <p>Phone: <strong>{selectedAppDetail.applicant?.phoneNumber}</strong></p>
                      <p>Location: <strong>{selectedAppDetail.applicant?.lga} LGA, {selectedAppDetail.applicant?.state}</strong></p>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-purple-900 bg-purple-200 px-2.5 py-0.5 rounded-full">
                          Status: {selectedAppDetail.application?.status}
                        </span>
                        <button
                          onClick={() => setPrintApp(selectedAppDetail)}
                          className="text-[11px] font-bold text-[#0f388a] underline flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Slip
                        </button>
                      </div>
                    </div>
                  </div>

                  {canApproveOrReject && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Officer Review Directives &amp; Decision
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Internal committee notes..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-200"
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleUpdateAppStatus('Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleUpdateAppStatus('Under Review')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Under Review</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleUpdateAppStatus('Needs Correction')}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Request Correction</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleUpdateAppStatus('Not Approved')}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Audit Logs Modal */}
      {showAuditLogs && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-[#0b2d72] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">PostgreSQL Audit Trail (Recent Actions)</h3>
              </div>
              <button onClick={() => setShowAuditLogs(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-[#0f388a]">{log.action}</span>
                    {log.targetReference && (
                      <span className="font-mono text-purple-700 font-bold ml-2">[{log.targetReference}]</span>
                    )}
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0">
                    <div>{log.adminEmail}</div>
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {printApp && (
        <PrintSlipModal
          isOpen={true}
          onClose={() => setPrintApp(null)}
          referenceNumber={printApp.application?.referenceNumber}
          applicantData={printApp.applicant}
          photoUrl={printApp.photo?.photoStorageUrl}
          signatureData={printApp.application?.signatureData}
          signatureDate={printApp.application?.signatureDate}
          status={printApp.application?.status}
          submittedAt={printApp.application?.submittedAt}
        />
      )}

    </div>
  );
};
