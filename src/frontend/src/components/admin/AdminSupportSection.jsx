import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, RefreshCw, MessageSquare, Mail, X, CheckCircle2, Clock } from 'lucide-react';
import { getAdminSupportTickets, updateAdminSupportTicket } from '../../services/api';

const TICKET_STATUSES = [
  { value: '', label: 'All' },
  { value: 'New', label: 'New' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];

const STATUS_STYLE = {
  New: { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', label: 'New' },
  InProgress: { color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE', label: 'In Progress' },
  Resolved: { color: '#047857', bg: '#D1FAE5', border: '#A7F3D0', label: 'Resolved' },
};

export default function AdminSupportSection({ onTicketsChanged }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState('New');
  const [editReply, setEditReply] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminSupportTickets({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        per_page: 15,
      });
      setTickets(res.data?.tickets || []);
      setMeta({ total: res.data?.total || 0, pages: res.data?.pages || 1 });
    } catch (err) {
      if (err?.response?.status !== 401) {
        toast.error('Failed to load support tickets.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(loadTickets, 220);
    return () => clearTimeout(t);
  }, [loadTickets]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const openTicket = (ticket) => {
    setSelected(ticket);
    setEditStatus(ticket.status || 'New');
    setEditReply(ticket.adminReply || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const res = await updateAdminSupportTicket(selected.id, {
        status: editStatus,
        adminReply: editReply,
      });
      toast.success(`Updated ticket ${selected.ticketCode}.`);
      setSelected(res.data);
      await loadTickets();
      onTicketsChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update support ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ad-section">
      <div className="ad-section-header">
        <div>
          <h2 className="ad-section-title">Support & Feedback Inbox</h2>
          <p className="ad-section-subtitle">
            Review incoming support requests and customer feedback from the Support Center
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm ad-btn-icon" onClick={loadTickets} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ad-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="ad-toolbar glass-card">
        <div className="ad-search-box">
          <Search size={16} className="ad-search-icon" />
          <input
            type="search"
            className="form-input ad-search-input"
            placeholder="Search by ticket code, name, email, or subject..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            aria-label="Search support tickets"
          />
        </div>
        <div className="ad-pill-filters" role="group" aria-label="Filter tickets by status">
          {TICKET_STATUSES.map((st) => (
            <button
              key={st.value || 'all'}
              type="button"
              aria-pressed={statusFilter === st.value}
              className={`ad-filter-pill ${statusFilter === st.value ? 'active' : ''}`}
              onClick={() => {
                setPage(1);
                setStatusFilter(st.value);
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ad-table-card glass-card">
        <div className="ad-table-wrapper">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Sender</th>
                <th>Subject & Message</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className={loading && tickets.length > 0 ? 'ad-tbody-loading' : ''}>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ad-table-empty">
                    {loading ? 'Loading tickets...' : 'No support tickets or feedback yet.'}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const st = STATUS_STYLE[t.status] || STATUS_STYLE.New;
                  return (
                    <tr key={t.id} className="ad-table-row">
                      <th scope="row" className="ad-row-header">
                        <span className="ad-code-text">{t.ticketCode}</span>
                        <div className="ad-cell-meta">
                          {new Date(t.createdAtUtc).toLocaleDateString('en-US')}
                        </div>
                      </th>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                        <div className="ad-cell-meta">{t.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {t.subject}
                        </div>
                        <div className="ad-review-content">{t.message}</div>
                      </td>
                      <td>
                        <span
                          className="ad-status-pill"
                          style={{ color: st.color, background: st.bg, borderColor: st.border }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm ad-btn-icon"
                          onClick={() => openTicket(t)}
                        >
                          <MessageSquare size={14} />
                          <span>Open</span>
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
            Page {page} of {meta.pages} ({meta.total} tickets)
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

      {/* Ticket Detail Drawer */}
      {selected && (
        <div className="ad-drawer-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <aside
            className="ad-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-drawer-header">
              <div>
                <h3 id="ticket-drawer-title" className="ad-drawer-title">
                  {selected.ticketCode} — {selected.subject}
                </h3>
                <p className="ad-cell-meta">
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {new Date(selected.createdAtUtc).toLocaleString('en-US')}
                </p>
              </div>
              <button
                type="button"
                className="ad-icon-close"
                onClick={() => setSelected(null)}
                aria-label="Close ticket details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ad-drawer-body">
              <div className="ad-detail-card">
                <h4>Sender Info</h4>
                <div className="ad-detail-row">
                  <strong>{selected.name}</strong>
                </div>
                <div className="ad-detail-row">
                  <Mail size={14} />
                  <a href={`mailto:${selected.email}`} style={{ color: 'var(--primary)' }}>
                    {selected.email}
                  </a>
                </div>
              </div>

              <div className="ad-detail-card">
                <h4>Customer Message</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {selected.message}
                </p>
              </div>

              <form className="ad-detail-card" onSubmit={handleSave}>
                <h4>Resolution & Internal Notes</h4>
                <div className="form-group">
                  <label htmlFor="tk-status" className="form-label">Status</label>
                  <select
                    id="tk-status"
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tk-notes" className="form-label">Internal Resolution Notes</label>
                  <p className="ad-cell-meta" style={{ margin: '0 0 6px' }}>
                    Saved internally for the support team (does not send an automated email).
                  </p>
                  <textarea
                    id="tk-notes"
                    className="form-input"
                    rows={4}
                    placeholder="Record follow-up actions, guidance given via email, or resolution summary..."
                    value={editReply}
                    onChange={(e) => setEditReply(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary ad-btn-icon"
                  disabled={saving}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <CheckCircle2 size={15} />
                  <span>{saving ? 'Saving...' : 'Save Update'}</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
