import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Shield, Lock, Unlock, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
} from '../../services/api';
import ConfirmDialog from './ConfirmDialog';

export default function AdminUserSection({ currentUser, formatPrice, onUsersChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [busyId, setBusyId] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'status' | 'role', user, nextValue }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({
        q: search.trim() || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'true',
        page,
        per_page: 15,
      });
      setUsers(res.data?.users || []);
      setMeta({ total: res.data?.total || 0, pages: res.data?.pages || 1 });
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load users.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(loadUsers, 220);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const isCurrentAdmin = (u) => {
    if (!currentUser) return false;
    const myId = currentUser.id ?? currentUser.user_id;
    if (myId != null && Number(u.id) === Number(myId)) return true;
    if (currentUser.email && u.email?.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    const { type, user, nextValue } = confirmAction;
    setBusyId(user.id);
    try {
      if (type === 'status') {
        await updateAdminUserStatus(user.id, nextValue);
        toast.success(nextValue ? `Unlocked account ${user.email}.` : `Locked account ${user.email}.`);
        onUsersChanged?.();
      } else {
        await updateAdminUserRole(user.id, nextValue);
        toast.success(`Updated role of ${user.email} to ${nextValue}.`);
      }
      setConfirmAction(null);
      await loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update user.');
    } finally {
      setBusyId(null);
    }
  };

  const renderMoney = (usd) =>
    typeof formatPrice === 'function' ? formatPrice(usd || 0) : `$${Number(usd || 0).toFixed(2)}`;

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">User Management</h2>
          <p className="ad-section-subtitle">
            {meta.total.toLocaleString('en-US')} accounts · Privacy-compliant (Skin Profile & Allergies excluded)
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ad-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="ad-privacy-note">
        <ShieldCheck size={16} style={{ flexShrink: 0 }} />
        <span>
          Sensitive Data Protection (NFR-PRIV-08): Admin only views basic account info and order totals; customer Skin Profile & Allergies are strictly private.
        </span>
      </div>

      {/* Filters */}
      <div className="ad-toolbar glass-card">
        <div className="ad-search-box">
          <Search size={16} className="ad-search-icon" />
          <input
            type="search"
            className="form-input ad-search-input"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            aria-label="Search users"
          />
        </div>
        <div className="ad-toolbar-selects">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Locked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className={loading && users.length > 0 ? 'ad-tbody-loading' : ''}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ad-table-empty">
                    {loading ? 'Loading users...' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = isCurrentAdmin(u);
                  return (
                    <tr key={u.id} className={`ad-table-row ${!u.isActive ? 'ad-row-muted' : ''}`}>
                      <td>
                        <div className="ad-user-cell">
                          <div className="ad-avatar-circle">
                            {(u.fullName || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.fullName}
                              {isSelf && (
                                <span className="ad-meta-tag" style={{ marginLeft: 8, fontSize: '0.68rem' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="ad-cell-meta">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.phone || <span className="ad-cell-meta">—</span>}</td>
                      <td>
                        <span className="ad-meta-tag">
                          {u.ordersCount} {u.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td className="ad-price">{renderMoney(u.totalSpentUsd)}</td>
                      <td>
                        <div className="ad-role-select-wrap">
                          <Shield size={13} color={u.role === 'Admin' ? '#4A3728' : '#9CA3AF'} />
                          <select
                            className="form-select ad-inline-select"
                            value={u.role}
                            disabled={busyId === u.id || isSelf}
                            title={isSelf ? 'Cannot change role of the currently signed-in admin' : undefined}
                            onChange={(e) => {
                              if (e.target.value !== u.role) {
                                setConfirmAction({ type: 'role', user: u, nextValue: e.target.value });
                              }
                            }}
                            aria-label={`Role for ${u.email}`}
                          >
                            <option value="Customer">Customer</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <span
                          className="ad-status-pill"
                          style={
                            u.isActive
                              ? { color: '#047857', background: '#D1FAE5', borderColor: '#A7F3D0' }
                              : { color: '#B91C1C', background: '#FEE2E2', borderColor: '#FECACA' }
                          }
                        >
                          {u.isActive ? 'Active' : 'Locked'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ad-btn-icon ${u.isActive ? 'btn-outline ad-archive-btn' : 'btn-secondary'}`}
                          disabled={busyId === u.id || isSelf}
                          title={isSelf ? 'Cannot lock the currently signed-in admin' : undefined}
                          onClick={() => setConfirmAction({ type: 'status', user: u, nextValue: !u.isActive })}
                        >
                          {u.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          <span>{u.isActive ? 'Lock' : 'Unlock'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ad-pagination-bar">
          <span className="ad-pagination-info">
            Page {page} of {meta.pages} ({meta.total.toLocaleString('en-US')} users)
          </span>
          <div className="ad-action-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= meta.pages || loading}
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Status / Role Change */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'status'
            ? confirmAction.nextValue ? 'Unlock Account?' : 'Lock Account?'
            : 'Change User Role?'
        }
        message={
          confirmAction?.type === 'status'
            ? confirmAction.nextValue
              ? `Restore sign-in access for ${confirmAction.user.email}?`
              : `Lock ${confirmAction.user.email}? This user will no longer be able to sign in.`
            : confirmAction
              ? `Change role of ${confirmAction.user.email} to ${confirmAction.nextValue}?`
              : ''
        }
        confirmLabel={
          confirmAction?.type === 'status'
            ? confirmAction.nextValue ? 'Unlock' : 'Lock Account'
            : 'Change Role'
        }
        tone={confirmAction?.type === 'status' && !confirmAction.nextValue ? 'danger' : 'primary'}
        busy={Boolean(confirmAction && busyId === confirmAction.user.id)}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </section>
  );
}
