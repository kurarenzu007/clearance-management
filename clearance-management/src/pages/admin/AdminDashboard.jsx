import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { clearanceService } from '../../services/clearanceService';
import { userService } from '../../services/userService';
import { settingsService } from '../../services/settingsService';
import '../../styles/dashboard.css';

const COLORS = ['#16a34a', '#FFD100', '#ea580c', '#dc2626', '#7c3aed'];

// ─── helpers ────────────────────────────────────────────────────────────────

function buildDeptStats(clearances) {
  const map = {};
  clearances.forEach((c) => {
    const dept = c.student?.department ?? 'Unknown';
    if (!map[dept]) map[dept] = { name: dept, total: 0, cleared: 0 };
    map[dept].total += 1;
    if (c.status === 'cleared') map[dept].cleared += 1;
  });
  return Object.values(map);
}

const EMPTY_STUDENT = { name: '', student_id: '', email: '', year_level: '1', department: '', section: '' };
const EMPTY_TEACHER = { name: '', email: '', department: '' };

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminDashboard({ activeTab }) {
  // Data state
  const [students,     setStudents]     = useState([]);
  const [teachers,     setTeachers]     = useState([]);
  const [clearances,   setClearances]   = useState([]);
  const [stats,        setStats]        = useState({ total: 0, cleared: 0, pending: 0, rejected: 0, held: 0, deficiency: 0 });
  const [deptStats,    setDeptStats]    = useState([]);
  const [settings,     setSettings]     = useState({ locked: false, semester: '1st Semester', academicYear: '2024-2025', startDate: '', endDate: '' });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  // UI state
  const [search,           setSearch]           = useState('');
  const [addStudentModal,  setAddStudentModal]  = useState(false);
  const [addTeacherModal,  setAddTeacherModal]  = useState(false);
  const [viewStudentModal, setViewStudentModal] = useState(null);
  const [editStudentModal, setEditStudentModal] = useState(null);
  const [viewTeacherModal, setViewTeacherModal] = useState(null);
  const [assignModal,      setAssignModal]      = useState(null);

  // Form state
  const [newStudent, setNewStudent] = useState(EMPTY_STUDENT);
  const [newTeacher, setNewTeacher] = useState(EMPTY_TEACHER);
  const [editForm,   setEditForm]   = useState({});
  const [formError,  setFormError]  = useState('');

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [studs, tchs, clears, sysSettings] = await Promise.all([
        userService.getAllUsers('student'),
        userService.getAllUsers('teacher'),
        clearanceService.getAllClearances(),
        settingsService.getAll(),
      ]);

      setStudents(studs);
      setTeachers(tchs);
      setClearances(clears);
      setDeptStats(buildDeptStats(clears));

      // Aggregate stats from clearances (server-side via RPC when available)
      const statsData = await clearanceService.getClearanceStats();
      setStats(statsData);

      // Map settings keys
      const lockSetting = sysSettings.find((s) => s.key === 'clearance_period_locked');
      const yearSetting = sysSettings.find((s) => s.key === 'academic_year');
      setSettings({
        locked:       lockSetting?.value?.locked      ?? false,
        academicYear: yearSetting?.value?.year         ?? '2024-2025',
        semester:     yearSetting?.value?.semester === '1st' ? '1st Semester' : '2nd Semester',
        startDate:    lockSetting?.value?.start_date  ?? '',
        endDate:      lockSetting?.value?.end_date    ?? '',
      });
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleLock = async (newLocked) => {
    try {
      setSaving(true);
      await settingsService.set('clearance_period_locked', {
        locked: newLocked,
        locked_at: newLocked ? new Date().toISOString() : null,
        start_date: settings.startDate || null,
        end_date: settings.endDate || null,
      });
      setSettings((s) => ({ ...s, locked: newLocked }));
    } catch (err) {
      console.error('Toggle lock failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const semCode = settings.semester.startsWith('1') ? '1st' : '2nd';
      await Promise.all([
        settingsService.set('academic_year', { year: settings.academicYear, semester: semCode }),
        settingsService.set('clearance_period_locked', {
          locked: settings.locked,
          locked_at: settings.locked ? new Date().toISOString() : null,
          start_date: settings.startDate || null,
          end_date: settings.endDate || null,
        }),
      ]);
    } catch (err) {
      console.error('Save config failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudent = async () => {
    setFormError('');
    if (!newStudent.name || !newStudent.email) { setFormError('Name and email are required.'); return; }
    try {
      setSaving(true);
      const created = await userService.createUser({ ...newStudent, role: 'student', year_level: parseInt(newStudent.year_level, 10) || 1 });
      setStudents((prev) => [created, ...prev]);
      setNewStudent(EMPTY_STUDENT);
      setAddStudentModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create student.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeacher = async () => {
    setFormError('');
    if (!newTeacher.name || !newTeacher.email) { setFormError('Name and email are required.'); return; }
    try {
      setSaving(true);
      const created = await userService.createUser({ ...newTeacher, role: 'teacher' });
      setTeachers((prev) => [created, ...prev]);
      setNewTeacher(EMPTY_TEACHER);
      setAddTeacherModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create faculty.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const updated = await userService.updateUser(editStudentModal.id, editForm);
      setStudents((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setEditStudentModal(null);
    } catch (err) {
      console.error('Edit failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = (reportName) => {
    const rows = reportName === 'Cleared Students'
      ? students.filter((s) => clearances.find((c) => c.student_id === s.id && c.status === 'cleared'))
      : students;

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${reportName}</title>
      <style>
        body{font-family:sans-serif;padding:40px}
        h1{color:#003DA5}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
        th{background:#003DA5;color:#fff}
      </style></head>
      <body>
        <h1>${reportName}</h1>
        <p>Generated: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>
        <table>
          <thead><tr><th>Name</th><th>Student ID</th><th>Department</th><th>Year</th></tr></thead>
          <tbody>${rows.map((s) => `<tr><td>${s.name}</td><td>${s.student_id ?? '—'}</td><td>${s.department ?? '—'}</td><td>${s.year_level ?? '—'}</td></tr>`).join('')}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Computed ────────────────────────────────────────────────────────────────

  const overallPct = students.length > 0
    ? Math.round((stats.cleared / students.length) * 100)
    : 0;

  const pieData = [
    { name: 'Cleared',    value: stats.cleared },
    { name: 'Pending',    value: stats.pending },
    { name: 'Held',       value: stats.held },
    { name: 'Rejected',   value: stats.rejected },
  ];

  const barData = deptStats.map((d) => ({
    name:      d.name.split(' ').slice(-1)[0],
    cleared:   d.cleared,
    remaining: d.total - d.cleared,
  }));

  const filteredStudents = students.filter((s) =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Teacher subjects lookup ─────────────────────────────────────────────────
  function teacherSubjects(teacherId) {
    const unique = new Set();
    clearances.forEach((c) => { if (c.teacher_id === teacherId && c.subject?.code) unique.add(c.subject.code); });
    return [...unique];
  }
  function teacherStudentCount(teacherId) {
    return new Set(clearances.filter((c) => c.teacher_id === teacherId).map((c) => c.student_id)).size;
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  // ========== Dashboard ==========
  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        {/* Period lock */}
        <div className="period-lock-card">
          <div className="period-lock-info">
            <h3>Clearance Period: {settings.semester} {settings.academicYear}</h3>
            <p>
              {settings.startDate && settings.endDate ? `${settings.startDate} → ${settings.endDate} · ` : ''}
              {settings.locked ? '🔒 Locked' : '🔓 Open for submission'}
            </p>
          </div>
          <label className="toggle-switch" aria-label={settings.locked ? 'Unlock clearance period' : 'Lock clearance period'}>
            <input
              type="checkbox"
              checked={!settings.locked}
              disabled={saving}
              onChange={(e) => handleToggleLock(!e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Stats grid */}
        <div className="stats-grid stagger-children">
          {[
            { label: 'Total Students', value: students.length,  icon: '◎', accent: 'var(--blue)',   bg: 'var(--blue-muted)',   color: 'var(--blue)' },
            { label: 'Fully Cleared',  value: stats.cleared,    icon: '✓', accent: 'var(--green)',  bg: 'var(--green-light)', color: 'var(--green)' },
            { label: 'Pending',        value: stats.pending,    icon: '◷', accent: 'var(--yellow)', bg: 'var(--yellow-light)', color: '#92400e' },
            { label: 'Rejected',       value: stats.rejected,   icon: '✕', accent: 'var(--red)',    bg: 'var(--red-light)',   color: 'var(--red)' },
          ].map((s) => (
            <div key={s.label} className="stat-card animate-fade-in" style={{ '--accent-color': s.accent }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="admin-chart-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Clearance by Department</div>
                <div className="chart-subtitle">Cleared vs Remaining</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7694' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7694' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Bar dataKey="cleared"   fill="#003DA5" radius={[4,4,0,0]} name="Cleared" />
                <Bar dataKey="remaining" fill="#e8effc" radius={[4,4,0,0]} name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Status Overview</div>
                <div className="chart-subtitle">{overallPct}% cleared overall</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS[i] }} />
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">Quick Reports</div>
            <div className="section-subtitle">Generate and download system reports</div>
          </div>
        </div>
        <ReportCards onExport={handleExportPdf} />
      </div>
    );
  }

  // ========== Students ==========
  if (activeTab === 'students') {
    return (
      <div className="animate-fade-in">
        <div className="section-header">
          <div>
            <div className="section-title">All Students</div>
            <div className="section-subtitle">{students.length} enrolled students</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setFormError(''); setNewStudent(EMPTY_STUDENT); setAddStudentModal(true); }}>
            + Add Student
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="form-input"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const sc = clearances.find((c) => c.student_id === s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="avatar" aria-hidden="true">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                        <div className="user-cell-info">
                          <div className="user-name">{s.name}</div>
                          <div className="user-id">{s.student_id ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.department ?? '—'}</td>
                    <td>{s.year_level ? `Year ${s.year_level}` : '—'}</td>
                    <td><StatusBadge status={sc?.status ?? 'pending'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          aria-label={`View ${s.name}`}
                          onClick={() => setViewStudentModal(s)}
                        >View</button>
                        <button
                          className="btn btn-outline btn-sm"
                          aria-label={`Edit ${s.name}`}
                          onClick={() => { setEditForm({ name: s.name, department: s.department ?? '', year_level: s.year_level ?? '', section: s.section ?? '' }); setEditStudentModal(s); }}
                        >Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Student Modal */}
        <Modal
          isOpen={addStudentModal}
          onClose={() => setAddStudentModal(false)}
          title="Add New Student"
          size="md"
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddStudentModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAddStudent}>
                {saving ? 'Adding…' : 'Add Student'}
              </button>
            </>
          }
        >
          <div className="modal-form-grid">
            {formError && <div style={{ gridColumn:'1/-1', color:'var(--red)', fontSize:'0.875rem' }}>{formError}</div>}
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="new-name">Full Name</label>
              <input id="new-name" className="form-input" placeholder="e.g. Maria Santos" value={newStudent.name} onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-sid">Student ID</label>
              <input id="new-sid" className="form-input" placeholder="STU-2024-015" value={newStudent.student_id} onChange={(e) => setNewStudent((p) => ({ ...p, student_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-year">Year Level</label>
              <select id="new-year" className="form-select form-input" value={newStudent.year_level} onChange={(e) => setNewStudent((p) => ({ ...p, year_level: e.target.value }))}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="new-email">Email</label>
              <input id="new-email" type="email" className="form-input" placeholder="student@university.edu" value={newStudent.email} onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="new-dept">Department</label>
              <input id="new-dept" className="form-input" placeholder="e.g. BS Computer Science" value={newStudent.department} onChange={(e) => setNewStudent((p) => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
        </Modal>

        {/* View Student Modal */}
        <Modal
          isOpen={!!viewStudentModal}
          onClose={() => setViewStudentModal(null)}
          title="Student Details"
          size="sm"
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setViewStudentModal(null)}>Close</button>}
        >
          {viewStudentModal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--blue-muted)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--blue)', color: 'var(--white)', fontSize: '1rem' }} aria-hidden="true">
                  {viewStudentModal.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--blue-dark)' }}>{viewStudentModal.name}</div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--blue)', marginTop: 2 }}>{viewStudentModal.student_id ?? '—'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {[
                  ['Email', viewStudentModal.email],
                  ['Department', viewStudentModal.department ?? '—'],
                  ['Year Level', viewStudentModal.year_level ? `Year ${viewStudentModal.year_level}` : '—'],
                  ['Section', viewStudentModal.section ?? '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Student Modal */}
        <Modal
          isOpen={!!editStudentModal}
          onClose={() => setEditStudentModal(null)}
          title="Edit Student"
          size="sm"
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditStudentModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSaveEdit}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        >
          {editStudentModal && (
            <div className="modal-form-grid">
              {[
                ['name', 'Full Name', 'text'],
                ['department', 'Department', 'text'],
                ['section', 'Section', 'text'],
              ].map(([key, label, type]) => (
                <div key={key} className="form-group form-group--full">
                  <label className="form-label" htmlFor={`edit-${key}`}>{label}</label>
                  <input id={`edit-${key}`} type={type} className="form-input" value={editForm[key] ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group form-group--full">
                <label className="form-label" htmlFor="edit-year">Year Level</label>
                <select id="edit-year" className="form-select form-input" value={editForm.year_level ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, year_level: e.target.value }))}>
                  {[1,2,3,4].map((y) => <option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
                </select>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ========== Teachers ==========
  if (activeTab === 'teachers') {
    return (
      <div className="animate-fade-in">
        <div className="section-header">
          <div>
            <div className="section-title">Faculty Management</div>
            <div className="section-subtitle">{teachers.length} faculty members</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setFormError(''); setNewTeacher(EMPTY_TEACHER); setAddTeacherModal(true); }}>
            + Add Faculty
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Department</th>
                <th>Subjects</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const subs = teacherSubjects(t.id);
                const studs = teacherStudentCount(t.id);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="avatar" aria-hidden="true">{t.name.split(' ').filter((_, i) => i > 0).map((n) => n[0]).join('').slice(0, 2) || t.name[0]}</div>
                        <div className="user-cell-info">
                          <div className="user-name">{t.name}</div>
                          <div className="user-id">{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.department ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {subs.length > 0 ? subs.map((s) => (
                          <span key={s} style={{ background: 'var(--blue-muted)', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-mono)' }}>
                            {s}
                          </span>
                        )) : <span style={{ color: 'var(--gray-300)', fontSize: '0.8125rem' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{studs}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          aria-label={`View ${t.name}`}
                          onClick={() => setViewTeacherModal(t)}
                        >View</button>
                        <button
                          className="btn btn-outline btn-sm"
                          aria-label={`Assign subjects to ${t.name}`}
                          onClick={() => setAssignModal(t)}
                        >Assign</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Faculty Modal */}
        <Modal
          isOpen={addTeacherModal}
          onClose={() => setAddTeacherModal(false)}
          title="Add Faculty Member"
          size="sm"
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddTeacherModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAddTeacher}>
                {saving ? 'Adding…' : 'Add Faculty'}
              </button>
            </>
          }
        >
          <div className="modal-form-grid">
            {formError && <div style={{ gridColumn: '1/-1', color: 'var(--red)', fontSize: '0.875rem' }}>{formError}</div>}
            {[
              ['new-t-name', 'name', 'Full Name', 'text', 'e.g. Prof. Juan dela Cruz'],
              ['new-t-email', 'email', 'Email', 'email', 'faculty@university.edu'],
              ['new-t-dept', 'department', 'Department', 'text', 'e.g. Computer Science'],
            ].map(([id, key, label, type, ph]) => (
              <div key={key} className="form-group form-group--full">
                <label className="form-label" htmlFor={id}>{label}</label>
                <input id={id} type={type} className="form-input" placeholder={ph} value={newTeacher[key]} onChange={(e) => setNewTeacher((p) => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Modal>

        {/* View Teacher Modal */}
        <Modal
          isOpen={!!viewTeacherModal}
          onClose={() => setViewTeacherModal(null)}
          title="Faculty Details"
          size="sm"
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setViewTeacherModal(null)}>Close</button>}
        >
          {viewTeacherModal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--blue-muted)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--blue)', color: 'var(--white)', fontSize: '1rem' }} aria-hidden="true">
                  {viewTeacherModal.name.split(' ').filter((_, i) => i > 0).map((n) => n[0]).join('').slice(0, 2) || viewTeacherModal.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--blue-dark)' }}>{viewTeacherModal.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--blue)', marginTop: 2 }}>{viewTeacherModal.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                {[
                  ['Department', viewTeacherModal.department ?? '—'],
                  ['Students', teacherStudentCount(viewTeacherModal.id)],
                  ['Subjects', teacherSubjects(viewTeacherModal.id).join(', ') || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ gridColumn: label === 'Subjects' ? '1/-1' : undefined }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Assign Subjects Modal (info — actual assignment is managed via subjects table) */}
        <Modal
          isOpen={!!assignModal}
          onClose={() => setAssignModal(null)}
          title={`Assign Subjects — ${assignModal?.name ?? ''}`}
          size="sm"
          footer={<button className="btn btn-ghost btn-sm" onClick={() => setAssignModal(null)}>Close</button>}
        >
          {assignModal && (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 12 }}>
                Currently assigned subjects (via clearances):
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {teacherSubjects(assignModal.id).length > 0
                  ? teacherSubjects(assignModal.id).map((s) => (
                    <span key={s} style={{ background: 'var(--blue-muted)', color: 'var(--blue)', fontSize: '0.8125rem', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>{s}</span>
                  ))
                  : <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No subjects assigned yet. Assign via the Subjects table in Supabase.</span>
                }
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ========== Reports ==========
  if (activeTab === 'reports') {
    return (
      <div className="animate-fade-in">
        <div className="section-header">
          <div>
            <div className="section-title">Reports & Analytics</div>
            <div className="section-subtitle">Generate and export clearance reports</div>
          </div>
        </div>
        <ReportCards onExport={handleExportPdf} />

        <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
          <div className="section-title">Department Summary</div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Students</th>
                <th>Cleared</th>
                <th>Remaining</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map((d) => {
                const pct = d.total > 0 ? Math.round((d.cleared / d.total) * 100) : 0;
                return (
                  <tr key={d.name}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.total}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{d.cleared}</td>
                    <td style={{ color: 'var(--orange)', fontWeight: 600 }}>{d.total - d.cleared}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gray-600)', width: 36 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ========== Settings ==========
  if (activeTab === 'settings') {
    return (
      <div className="animate-fade-in">
        <div className="section-title" style={{ marginBottom: 'var(--space-6)' }}>System Settings</div>

        <div className="period-lock-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="period-lock-info">
            <h3>Clearance Period Lock</h3>
            <p>{settings.locked ? 'Students cannot submit clearances' : 'Clearances are open for submission'}</p>
          </div>
          <label className="toggle-switch" aria-label={settings.locked ? 'Unlock clearance period' : 'Lock clearance period'}>
            <input
              type="checkbox"
              checked={!settings.locked}
              disabled={saving}
              onChange={(e) => handleToggleLock(!e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-5)', fontSize: '1rem' }}>Clearance Period Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Semester',      key: 'semester',      type: 'text' },
              { label: 'Academic Year', key: 'academicYear',  type: 'text' },
              { label: 'Start Date',    key: 'startDate',     type: 'date' },
              { label: 'End Date',      key: 'endDate',       type: 'date' },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label className="form-label" htmlFor={`cfg-${f.key}`}>{f.label}</label>
                <input
                  id={`cfg-${f.key}`}
                  type={f.type}
                  className="form-input"
                  value={settings[f.key] ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSaveConfig}>
              {saving ? 'Saving…' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Report Cards ──────────────────────────────────────────────────────────────

function ReportCards({ onExport }) {
  const reports = [
    { name: 'Cleared Students', desc: 'Export list of fully cleared students with certificate status', icon: '✓', color: 'var(--green)',  bg: 'var(--green-light)' },
    { name: 'Pending List',     desc: 'Students with incomplete clearance requirements',              icon: '◷', color: '#92400e',       bg: 'var(--yellow-light)' },
    { name: 'Deficiency Report',desc: 'Students flagged with deficiencies per department',            icon: '!', color: 'var(--orange)', bg: 'var(--orange-light)' },
    { name: 'Full Summary',     desc: 'Complete clearance summary across all departments',             icon: '⊡', color: 'var(--blue)',   bg: 'var(--blue-muted)' },
  ];

  return (
    <div className="report-grid">
      {reports.map((r) => (
        <div key={r.name} className="report-card">
          <div className="report-icon" style={{ background: r.bg, color: r.color, fontSize: '1.25rem' }}>{r.icon}</div>
          <div>
            <div className="report-name">{r.name}</div>
            <div className="report-desc">{r.desc}</div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ alignSelf: 'flex-start' }}
            aria-label={`Export ${r.name} as PDF`}
            onClick={() => onExport(r.name)}
          >
            ↓ Export PDF
          </button>
        </div>
      ))}
    </div>
  );
}
