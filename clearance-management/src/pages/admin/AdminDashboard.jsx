import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { ADMIN_STATS, MOCK_ALL_STUDENTS, MOCK_TEACHERS, CLEARANCE_PERIOD } from '../../utils/mockData';
import '../../styles/dashboard.css';

const COLORS = ['#16a34a', '#FFD100', '#ea580c', '#dc2626', '#7c3aed'];

export default function AdminDashboard({ activeTab }) {
  const [students] = useState(MOCK_ALL_STUDENTS);
  const [teachers] = useState(MOCK_TEACHERS);
  const [periodLocked, setPeriodLocked] = useState(CLEARANCE_PERIOD.isLocked);
  const [addUserModal, setAddUserModal] = useState(false);
  const [search, setSearch] = useState('');

  const overallPct = Math.round((ADMIN_STATS.cleared / ADMIN_STATS.totalStudents) * 100);

  const pieData = [
    { name: 'Cleared', value: ADMIN_STATS.cleared },
    { name: 'Pending', value: ADMIN_STATS.pending },
    { name: 'Held', value: ADMIN_STATS.held },
    { name: 'Rejected', value: ADMIN_STATS.rejected },
  ];

  const barData = ADMIN_STATS.departments.map((d) => ({
    name: d.name.split(' ').slice(-1)[0],
    cleared: d.cleared,
    remaining: d.total - d.cleared,
  }));

  // ========== Dashboard ==========
  if (activeTab === 'dashboard') {
    return (
      <div className="animate-fade-in">
        {/* Period lock */}
        <div className="period-lock-card">
          <div className="period-lock-info">
            <h3>Clearance Period: {CLEARANCE_PERIOD.semester} {CLEARANCE_PERIOD.academicYear}</h3>
            <p>
              {CLEARANCE_PERIOD.startDate} → {CLEARANCE_PERIOD.endDate} ·{' '}
              {periodLocked ? '🔒 Locked' : '🔓 Open for submission'}
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!periodLocked}
              onChange={() => setPeriodLocked((v) => !v)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Stats grid */}
        <div className="stats-grid stagger-children">
          {[
            { label: 'Total Students', value: ADMIN_STATS.totalStudents, icon: '◎', accent: 'var(--blue)', bg: 'var(--blue-muted)', color: 'var(--blue)' },
            { label: 'Fully Cleared', value: ADMIN_STATS.cleared, icon: '✓', accent: 'var(--green)', bg: 'var(--green-light)', color: 'var(--green)' },
            { label: 'Pending', value: ADMIN_STATS.pending, icon: '◷', accent: 'var(--yellow)', bg: 'var(--yellow-light)', color: '#92400e' },
            { label: 'Rejected', value: ADMIN_STATS.rejected, icon: '✕', accent: 'var(--red)', bg: 'var(--red-light)', color: 'var(--red)' },
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
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                />
                <Bar dataKey="cleared" fill="#003DA5" radius={[4, 4, 0, 0]} name="Cleared" />
                <Bar dataKey="remaining" fill="#e8effc" radius={[4, 4, 0, 0]} name="Remaining" />
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
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
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

        {/* Reports quick access */}
        <div className="section-header">
          <div>
            <div className="section-title">Quick Reports</div>
            <div className="section-subtitle">Generate and download system reports</div>
          </div>
        </div>
        <ReportCards />
      </div>
    );
  }

  // ========== Students ==========
  if (activeTab === 'students') {
    const filtered = students.filter((s) =>
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="animate-fade-in">
        <div className="section-header">
          <div>
            <div className="section-title">All Students</div>
            <div className="section-subtitle">{students.length} enrolled students</div>
          </div>
          <button className="btn btn-primary" onClick={() => setAddUserModal(true)}>
            + Add Student
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div className="search-wrapper" style={{ flex: 1 }}>
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="form-input"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                      <div className="user-cell-info">
                        <div className="user-name">{s.name}</div>
                        <div className="user-id">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.course}</td>
                  <td>{s.year}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm">View</button>
                      <button className="btn btn-outline btn-sm">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={addUserModal}
          onClose={() => setAddUserModal(false)}
          title="Add New Student"
          size="md"
          footer={
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddUserModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => setAddUserModal(false)}>Add Student</button>
            </>
          }
        >
          <div className="modal-form-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="e.g. Maria Santos" />
            </div>
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input className="form-input" placeholder="STU-2024-015" />
            </div>
            <div className="form-group">
              <label className="form-label">Year Level</label>
              <select className="form-select form-input">
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Email</label>
              <input className="form-input" placeholder="student@university.edu" />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Course</label>
              <input className="form-input" placeholder="e.g. BS Computer Science" />
            </div>
          </div>
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
          <button className="btn btn-primary">+ Add Faculty</button>
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
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar">{t.name.split(' ').filter((_, i) => i > 0).map((n) => n[0]).join('').slice(0, 2)}</div>
                      <div className="user-cell-info">
                        <div className="user-name">{t.name}</div>
                        <div className="user-id">{t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.department}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {t.subjects.map((s) => (
                        <span key={s} style={{
                          background: 'var(--blue-muted)',
                          color: 'var(--blue)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.students}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm">View</button>
                      <button className="btn btn-outline btn-sm">Assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <ReportCards />

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
              {ADMIN_STATS.departments.map((d) => {
                const pct = Math.round((d.cleared / d.total) * 100);
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
            <p>{periodLocked ? 'Students cannot submit clearances' : 'Clearances are open for submission'}</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={!periodLocked} onChange={() => setPeriodLocked((v) => !v)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-5)', fontSize: '1rem' }}>Clearance Period Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Semester', value: CLEARANCE_PERIOD.semester },
              { label: 'Academic Year', value: CLEARANCE_PERIOD.academicYear },
              { label: 'Start Date', value: CLEARANCE_PERIOD.startDate },
              { label: 'End Date', value: CLEARANCE_PERIOD.endDate },
            ].map((f) => (
              <div key={f.label} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="form-input" defaultValue={f.value} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary">Save Configuration</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ReportCards() {
  const reports = [
    { name: 'Cleared Students', desc: 'Export list of fully cleared students with certificate status', icon: '✓', color: 'var(--green)', bg: 'var(--green-light)' },
    { name: 'Pending List', desc: 'Students with incomplete clearance requirements', icon: '◷', color: '#92400e', bg: 'var(--yellow-light)' },
    { name: 'Deficiency Report', desc: 'Students flagged with deficiencies per department', icon: '!', color: 'var(--orange)', bg: 'var(--orange-light)' },
    { name: 'Full Summary', desc: 'Complete clearance summary across all departments', icon: '⊡', color: 'var(--blue)', bg: 'var(--blue-muted)' },
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
          <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
            ↓ Export PDF
          </button>
        </div>
      ))}
    </div>
  );
}