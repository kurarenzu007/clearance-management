import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { clearanceService } from '../../services/clearanceService';
import '../../styles/dashboard.css';

const statusOrder = { rejected: 0, held: 1, deficiency: 1, pending: 2, cleared: 3 };

export default function StudentDashboard({ activeTab }) {
  const { user } = useAuth();
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchClearances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clearanceService.getStudentClearances(user.id);
      setClearances(data);
    } catch (err) {
      console.error('Failed to load clearances:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchClearances(); }, [fetchClearances]);

  // Normalise DB rows to shape the UI expects
  const normalised = clearances.map((c) => ({
    id:        c.id,
    subject:   c.subject?.name  ?? '—',
    code:      c.subject?.code  ?? '—',
    teacher:   c.teacher?.name  ?? '—',
    status:    c.status,
    remark:    c.remarks,
    clearedAt: c.cleared_at,
  }));

  const counts = {
    total:    normalised.length,
    cleared:  normalised.filter((c) => c.status === 'cleared').length,
    pending:  normalised.filter((c) => c.status === 'pending').length,
    held:     normalised.filter((c) => c.status === 'held').length,
    rejected: normalised.filter((c) => c.status === 'rejected').length,
  };

  const pct = counts.total > 0 ? Math.round((counts.cleared / counts.total) * 100) : 0;
  const isFullyCleared = counts.total > 0 && counts.cleared === counts.total;

  const filtered = filter === 'all'
    ? [...normalised].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    : normalised.filter((c) => c.status === filter);

  const handleDownloadCertificate = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Clearance Certificate</title>
      <style>
        body { font-family: serif; padding: 60px; max-width: 700px; margin: 0 auto; }
        h1 { text-align:center; color:#003DA5; }
        .subtitle { text-align:center; color:#555; margin-bottom:40px; }
        .name { text-align:center; font-size:1.8rem; font-weight:700; margin:30px 0; }
        .body { line-height:2; }
        .footer { margin-top:60px; display:flex; justify-content:space-between; }
        .sig { text-align:center; }
        .sig-line { border-top:1px solid #333; width:180px; margin:0 auto 4px; }
      </style></head>
      <body>
        <h1>STUDENT CLEARANCE CERTIFICATE</h1>
        <p class="subtitle">Student Clearance Management System</p>
        <p class="body">This is to certify that</p>
        <p class="name">${user.name}</p>
        <p class="body">
          Student ID: <strong>${user.student_id ?? '—'}</strong><br/>
          Department: <strong>${user.department ?? '—'}</strong><br/>
          has satisfactorily complied with all academic and administrative clearance requirements
          for the current semester.
        </p>
        <p class="body">Date Issued: <strong>${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</strong></p>
        <div class="footer">
          <div class="sig"><div class="sig-line"></div>Registrar</div>
          <div class="sig"><div class="sig-line"></div>Dean</div>
        </div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // Shared detail modal
  const detailModal = (
    <Modal
      isOpen={!!selectedCard}
      onClose={() => setSelectedCard(null)}
      title="Clearance Details"
      size="sm"
      footer={
        <button className="btn btn-primary btn-sm" onClick={() => setSelectedCard(null)}>
          Done
        </button>
      }
    >
      {selectedCard && <ClearanceDetailContent clearance={selectedCard} />}
    </Modal>
  );

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p>Loading clearances…</p>
      </div>
    );
  }

  // === Dashboard Tab ===
  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <div className="clearance-overview">
          <div className="overview-header">
            <div>
              <div className="overview-greeting">
                Hello, <span>{user.name.split(' ')[0]}</span>! 👋
              </div>
              <div className="overview-subtitle">
                {user.department} · Year {user.year_level} · {user.section}
              </div>
            </div>
            <div className="overview-status-chip">
              {isFullyCleared ? '✓ Fully Cleared' : `${counts.pending + counts.held + counts.rejected} Remaining`}
            </div>
          </div>

          <div className="overview-progress-section">
            <div className="overview-progress-label">
              <span>Overall Clearance Progress</span>
              <span className="overview-progress-pct">{pct}%</span>
            </div>
            <div className="overview-progress-bar">
              <div className="overview-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="overview-footer-stats">
            {[
              { num: counts.cleared, label: 'Cleared' },
              { num: counts.pending, label: 'Pending' },
              { num: counts.held,    label: 'On Hold' },
              { num: counts.rejected, label: 'Rejected' },
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
            { label: 'Total Requirements', value: counts.total,                      icon: '◈', color: '#003DA5',       bg: '#e8effc',            accent: '#003DA5' },
            { label: 'Cleared',            value: counts.cleared,                    icon: '✓', color: 'var(--green)',  bg: 'var(--green-light)', accent: 'var(--green)' },
            { label: 'Pending Review',     value: counts.pending,                    icon: '◷', color: '#92400e',       bg: 'var(--yellow-light)', accent: 'var(--yellow)' },
            { label: 'Needs Attention',    value: counts.held + counts.rejected,     icon: '!', color: 'var(--red)',    bg: 'var(--red-light)',   accent: 'var(--red)' },
          ].map((s) => (
            <div key={s.label} className="stat-card animate-fade-in" style={{ '--accent-color': s.accent }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color, fontSize: '1.25rem' }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">Recent Updates</div>
            <div className="section-subtitle">Click any card for details</div>
          </div>
        </div>

        <div className="clearance-grid stagger-children">
          {[...normalised]
            .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
            .slice(0, 4)
            .map((c) => (
              <ClearanceCard key={c.id} clearance={c} onClick={() => setSelectedCard(c)} />
            ))}
        </div>

        {detailModal}
      </div>
    );
  }

  // === Clearance Tab ===
  if (activeTab === 'clearance') {
    return (
      <div className="animate-fade-in">
        <div className="section-header">
          <div>
            <div className="section-title">My Clearance Status</div>
            <div className="section-subtitle">{counts.cleared} of {counts.total} requirements cleared</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue)' }}>
            {pct}%
          </div>
        </div>

        <div className="teacher-filters" style={{ marginBottom: 'var(--space-5)' }}>
          {[
            { id: 'all',      label: `All (${counts.total})` },
            { id: 'cleared',  label: `Cleared (${counts.cleared})` },
            { id: 'pending',  label: `Pending (${counts.pending})` },
            { id: 'held',     label: `On Hold (${counts.held})` },
            { id: 'rejected', label: `Rejected (${counts.rejected})` },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="clearance-grid stagger-children">
          {filtered.map((c) => (
            <ClearanceCard key={c.id} clearance={c} onClick={() => setSelectedCard(c)} />
          ))}
        </div>

        {detailModal}
      </div>
    );
  }

  // === Certificate Tab ===
  if (activeTab === 'certificate') {
    return (
      <div className="animate-fade-in">
        {isFullyCleared ? (
          <div className="certificate-ready">
            <div className="certificate-icon">🎓</div>
            <div className="certificate-title">Clearance Certificate Ready!</div>
            <div className="certificate-sub">All requirements have been cleared. Download your certificate now.</div>
            <button
              className="btn btn-yellow btn-lg"
              style={{ marginTop: 'var(--space-2)' }}
              onClick={handleDownloadCertificate}
              aria-label="Download clearance certificate as PDF"
            >
              ↓ Download PDF Certificate
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Certificate Not Yet Available
            </h3>
            <p style={{ color: 'var(--gray-500)', maxWidth: 400, margin: '0 auto var(--space-6)' }}>
              Complete all clearance requirements first. You still have{' '}
              <strong>{counts.total - counts.cleared}</strong> remaining.
            </p>
            <div className="progress-bar" style={{ maxWidth: 320, margin: '0 auto' }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ marginTop: 'var(--space-2)', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              {pct}% complete
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Clearance Card ────────────────────────────────────────────────────────────

function ClearanceCard({ clearance, onClick }) {
  return (
    <div
      className={`clearance-card card-hover animate-fade-in ${clearance.status}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View details for ${clearance.subject}`}
    >
      <div className="clearance-card-top">
        <div>
          <div className="subject-name">{clearance.subject}</div>
          <div className="subject-code">{clearance.code}</div>
        </div>
        <StatusBadge status={clearance.status} />
      </div>

      <div className="clearance-card-teacher">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        {clearance.teacher}
      </div>

      {clearance.remark && (
        <div className="clearance-card-remark">{clearance.remark}</div>
      )}

      {clearance.status === 'cleared' && clearance.clearedAt && (
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 'var(--space-2)' }}>
          Cleared on {new Date(clearance.clearedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}

// ─── Clearance Detail Modal Content ───────────────────────────────────────────

function ClearanceDetailContent({ clearance }) {
  const STATUS_COLOR = {
    cleared:    { border: 'var(--green)',  bg: 'var(--green-light)' },
    pending:    { border: 'var(--yellow)', bg: 'var(--yellow-light)' },
    held:       { border: 'var(--orange)', bg: 'var(--orange-light)' },
    rejected:   { border: 'var(--red)',    bg: 'var(--red-light)' },
    deficiency: { border: 'var(--orange)', bg: 'var(--orange-light)' },
  };
  const colors = STATUS_COLOR[clearance.status] || STATUS_COLOR.pending;

  const lbl = { fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 };
  const val = { fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: colors.bg, borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{clearance.subject}</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--gray-500)', marginTop: 1 }}>{clearance.code}</div>
        </div>
        <StatusBadge status={clearance.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
        <div>
          <div style={lbl}>Teacher</div>
          <div style={val}>{clearance.teacher}</div>
        </div>
        <div>
          <div style={lbl}>Status</div>
          <div style={{ ...val, textTransform: 'capitalize' }}>{clearance.status}</div>
        </div>
        {clearance.clearedAt && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={lbl}>Cleared On</div>
            <div style={val}>{new Date(clearance.clearedAt).toLocaleDateString('en-PH', { dateStyle: 'long' })}</div>
          </div>
        )}
      </div>

      {clearance.remark && (
        <div style={{ background: 'var(--gray-50)', borderLeft: `3px solid ${colors.border}`, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--gray-700)', lineHeight: 1.55 }}>
          <div style={{ ...lbl, color: 'var(--gray-500)', marginBottom: 4 }}>Remark from Teacher</div>
          {clearance.remark}
        </div>
      )}
    </div>
  );
}
