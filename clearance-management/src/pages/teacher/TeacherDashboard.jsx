import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { clearanceService } from '../../services/clearanceService';
import '../../styles/dashboard.css';

export default function TeacherDashboard({ activeTab }) {
  const { user } = useAuth();
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState([]);

  const [remarkModal, setRemarkModal] = useState(null); // { clearance, nextStatus }
  const [remark, setRemark]           = useState('');
  const [viewModal, setViewModal]     = useState(null);
  const [saving, setSaving]           = useState(false);

  // Fetch teacher's clearances from Supabase
  const fetchClearances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clearanceService.getTeacherClearances(user.id);
      setClearances(data);
    } catch (err) {
      console.error('Failed to load teacher clearances:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);

  // Normalise DB rows to shape the UI expects
  const students = clearances.map((c) => ({
    _clearanceId: c.id,
    id:           c.student?.student_id ?? c.student_id,
    name:         c.student?.name       ?? '—',
    course:       c.student?.department ?? '—',
    year:         c.student?.year_level ? `Year ${c.student.year_level}` : '—',
    status:       c.status,
    remark:       c.remarks,
  }));

  const counts = {
    all:      students.length,
    pending:  students.filter((s) => s.status === 'pending').length,
    cleared:  students.filter((s) => s.status === 'cleared').length,
    held:     students.filter((s) => s.status === 'held').length,
    rejected: students.filter((s) => s.status === 'rejected').length,
  };

  const filtered = students
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) =>
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    );

  // Wire status update to service
  const updateStatus = useCallback(async (clearanceId, newStatus, newRemark = '') => {
    try {
      setSaving(true);
      await clearanceService.updateClearanceStatus(clearanceId, newStatus, newRemark || null);
      setClearances((prev) =>
        prev.map((c) => c.id === clearanceId ? { ...c, status: newStatus, remarks: newRemark } : c)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Wire bulk approve to service
  const bulkApprove = useCallback(async () => {
    if (selected.length === 0) return;
    try {
      setSaving(true);
      // selected contains clearance IDs
      await clearanceService.bulkUpdateClearances(selected, 'cleared');
      setClearances((prev) =>
        prev.map((c) => selected.includes(c.id) ? { ...c, status: 'cleared' } : c)
      );
      setSelected([]);
    } catch (err) {
      console.error('Bulk approve failed:', err);
    } finally {
      setSaving(false);
    }
  }, [selected]);

  const toggleSelect = (clearanceId) => {
    setSelected((prev) =>
      prev.includes(clearanceId) ? prev.filter((x) => x !== clearanceId) : [...prev, clearanceId]
    );
  };

  const openRemarkModal = (student, nextStatus) => {
    setRemarkModal({ student, nextStatus });
    setRemark('');
  };

  const submitRemark = async () => {
    if (remarkModal) {
      await updateStatus(remarkModal.student._clearanceId, remarkModal.nextStatus, remark);
      setRemarkModal(null);
    }
  };

  // ── Shared modals ──────────────────────────────────────────────────────────

  const sharedModals = (
    <>
      <Modal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Student Details"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            {viewModal?.status !== 'cleared' && (
              <>
                <button
                  className="btn btn-success btn-sm"
                  disabled={saving}
                  onClick={() => { updateStatus(viewModal._clearanceId, 'cleared'); setViewModal(null); }}
                  aria-label="Approve clearance"
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => { setViewModal(null); openRemarkModal(viewModal, 'held'); }}
                  aria-label="Hold clearance"
                >
                  Hold
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => { setViewModal(null); openRemarkModal(viewModal, 'rejected'); }}
                  aria-label="Reject clearance"
                >
                  Reject
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(null)}>Close</button>
          </div>
        }
      >
        {viewModal && <StudentDetailContent student={viewModal} />}
      </Modal>

      <Modal
        isOpen={!!remarkModal}
        onClose={() => setRemarkModal(null)}
        title={`${remarkModal?.nextStatus === 'held' ? '⏸ Hold Clearance' : '✕ Reject Clearance'}`}
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setRemarkModal(null)}>Cancel</button>
            <button
              className={`btn btn-sm ${remarkModal?.nextStatus === 'held' ? 'btn-outline' : 'btn-danger'}`}
              disabled={saving}
              onClick={submitRemark}
            >
              {remarkModal?.nextStatus === 'held' ? 'Confirm Hold' : 'Confirm Reject'}
            </button>
          </>
        }
      >
        {remarkModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
              <div className="avatar" style={{ flexShrink: 0 }}>
                {remarkModal.student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{remarkModal.student.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)' }}>
                  {remarkModal.student.id} · {remarkModal.student.course}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge status={remarkModal.student.status} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="remark-text">
                {remarkModal.nextStatus === 'held' ? 'What must the student fix?' : 'Reason for rejection'}
              </label>
              <textarea
                id="remark-text"
                className="form-textarea form-input"
                rows={3}
                placeholder="e.g. Missing laboratory report for Module 4..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                style={{ resize: 'none', fontSize: '0.875rem' }}
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p>Loading students…</p>
      </div>
    );
  }

  // ── Dashboard Tab ──────────────────────────────────────────────────────────

  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <div className="clearance-overview" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="overview-header">
            <div>
              <div className="overview-greeting">
                Welcome, <span>{user.name.split(' ').slice(-1)[0]}</span>! 👋
              </div>
              <div className="overview-subtitle">{user.department}</div>
            </div>
          </div>
          <div className="overview-footer-stats">
            {[
              { num: counts.all,                        label: 'Total Students' },
              { num: counts.pending,                    label: 'Pending Review' },
              { num: counts.cleared,                    label: 'Cleared' },
              { num: counts.held + counts.rejected,     label: 'Need Action' },
            ].map((s) => (
              <div key={s.label}>
                <div className="overview-foot-stat-num">{s.num}</div>
                <div className="overview-foot-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-grid stagger-children">
          {[
            { label: 'Pending Review', value: counts.pending,  color: '#92400e',       bg: 'var(--yellow-light)', accent: 'var(--yellow)', icon: '◷' },
            { label: 'Cleared',        value: counts.cleared,  color: 'var(--green)',  bg: 'var(--green-light)',  accent: 'var(--green)',  icon: '✓' },
            { label: 'On Hold',        value: counts.held,     color: 'var(--orange)', bg: 'var(--orange-light)', accent: 'var(--orange)', icon: '⊡' },
            { label: 'Rejected',       value: counts.rejected, color: 'var(--red)',    bg: 'var(--red-light)',    accent: 'var(--red)',    icon: '✕' },
          ].map((s) => (
            <div key={s.label} className="stat-card animate-fade-in" style={{ '--accent-color': s.accent }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">Needs Attention</div>
            <div className="section-subtitle">Students awaiting your review</div>
          </div>
        </div>

        <StudentTable
          students={students.filter((s) => s.status !== 'cleared').slice(0, 5)}
          selected={selected}
          onToggleSelect={toggleSelect}
          onView={(s) => setViewModal(s)}
          onApprove={(s) => updateStatus(s._clearanceId, 'cleared')}
          onReject={(s) => openRemarkModal(s, 'rejected')}
          onHold={(s) => openRemarkModal(s, 'held')}
        />

        {sharedModals}
      </div>
    );
  }

  // ── Students / Pending / Cleared Tabs ─────────────────────────────────────

  const showStudents = activeTab === 'students' || activeTab === 'pending' || activeTab === 'cleared';
  if (showStudents) {
    const tableStudents = activeTab === 'students'
      ? filtered
      : students.filter((s) => s.status === (activeTab === 'pending' ? 'pending' : 'cleared'));

    return (
      <div className="animate-fade-in">
        {selected.length > 0 && (
          <div className="bulk-actions-bar">
            <span>{selected.length} student{selected.length > 1 ? 's' : ''} selected</span>
            <div className="bulk-actions-buttons">
              <button className="btn btn-success btn-sm" disabled={saving} onClick={bulkApprove}>✓ Bulk Approve</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'white' }} onClick={() => setSelected([])}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
          {activeTab === 'students' && (
            <div className="teacher-filters" style={{ flex: 1, margin: 0 }}>
              {['all', 'pending', 'cleared', 'held', 'rejected'].map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f] ?? 0})
                </button>
              ))}
            </div>
          )}
          <div className="search-wrapper" style={{ minWidth: 220 }}>
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="form-input"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>
        </div>

        <StudentTable
          students={tableStudents}
          selected={selected}
          onToggleSelect={toggleSelect}
          onView={(s) => setViewModal(s)}
          onApprove={(s) => updateStatus(s._clearanceId, 'cleared')}
          onReject={(s) => openRemarkModal(s, 'rejected')}
          onHold={(s) => openRemarkModal(s, 'held')}
        />

        {sharedModals}
      </div>
    );
  }

  return null;
}

// ─── Student Table ─────────────────────────────────────────────────────────────

function StudentTable({ students, selected, onToggleSelect, onView, onApprove, onReject, onHold }) {
  if (students.length === 0) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <h3>No students found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>
    );
  }

  const allChecked = students.length > 0 && students.every((s) => selected.includes(s._clearanceId));

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input
                type="checkbox"
                aria-label="Select all students"
                checked={allChecked}
                onChange={(e) => students.forEach((s) =>
                  e.target.checked
                    ? !selected.includes(s._clearanceId) && onToggleSelect(s._clearanceId)
                    : selected.includes(s._clearanceId) && onToggleSelect(s._clearanceId)
                )}
              />
            </th>
            <th>Student</th>
            <th>Course</th>
            <th>Year</th>
            <th>Status</th>
            <th>Remark</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._clearanceId}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select ${s.name}`}
                  checked={selected.includes(s._clearanceId)}
                  onChange={() => onToggleSelect(s._clearanceId)}
                />
              </td>
              <td>
                <div className="user-info-cell" style={{ cursor: 'pointer' }} onClick={() => onView(s)}>
                  <div className="avatar" aria-hidden="true">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                  <div className="user-cell-info">
                    <div className="user-name">{s.name}</div>
                    <div className="user-id">{s.id}</div>
                  </div>
                </div>
              </td>
              <td>{s.course}</td>
              <td>{s.year}</td>
              <td><StatusBadge status={s.status} /></td>
              <td style={{ maxWidth: 180, color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                {s.remark
                  ? <span title={s.remark} style={{ cursor: 'help' }}>
                      {s.remark.length > 30 ? s.remark.slice(0, 30) + '…' : s.remark}
                    </span>
                  : <span style={{ color: 'var(--gray-300)' }}>—</span>}
              </td>
              <td>
                {s.status !== 'cleared' ? (
                  <div className="student-row-actions">
                    <button
                      className="action-btn action-btn-approve tooltip"
                      data-tip="Approve"
                      aria-label={`Approve ${s.name}`}
                      onClick={() => onApprove(s)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button
                      className="action-btn action-btn-hold tooltip"
                      data-tip="Hold"
                      aria-label={`Hold ${s.name}`}
                      onClick={() => onHold(s)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    </button>
                    <button
                      className="action-btn action-btn-reject tooltip"
                      data-tip="Reject"
                      aria-label={`Reject ${s.name}`}
                      onClick={() => onReject(s)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 600 }}>✓ Done</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Student Detail Modal Content ─────────────────────────────────────────────

function StudentDetailContent({ student }) {
  const lbl = { fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 };
  const val = { fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--blue-muted)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
        <div className="avatar avatar-lg" style={{ background: 'var(--blue)', color: 'var(--white)', fontSize: '1rem' }} aria-hidden="true">
          {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--blue-dark)' }}>{student.name}</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--blue)', marginTop: 2 }}>{student.id}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StatusBadge status={student.status} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
        <div>
          <div style={lbl}>Course</div>
          <div style={val}>{student.course}</div>
        </div>
        <div>
          <div style={lbl}>Year Level</div>
          <div style={val}>{student.year}</div>
        </div>
        <div>
          <div style={lbl}>Current Status</div>
          <div style={{ ...val, textTransform: 'capitalize' }}>{student.status}</div>
        </div>
      </div>

      {student.remark && (
        <div style={{ background: 'var(--orange-light)', borderLeft: '3px solid var(--orange)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--gray-700)', lineHeight: 1.55 }}>
          <div style={{ ...lbl, color: 'var(--orange)', marginBottom: 4 }}>Active Remark</div>
          {student.remark}
        </div>
      )}
    </div>
  );
}
