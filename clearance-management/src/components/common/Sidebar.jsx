import { useAuth } from '../../context/AuthContext';

// Student nav items
const STUDENT_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', section: 'main' },
  { id: 'clearance', label: 'My Clearance', icon: '✓', section: 'main', badge: 3 },
  { id: 'certificate', label: 'Certificate', icon: '◈', section: 'main' },
];

// Teacher nav items
const TEACHER_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', section: 'main' },
  { id: 'students', label: 'My Students', icon: '◎', section: 'main', badge: 4 },
  { id: 'pending', label: 'Pending Requests', icon: '◷', section: 'main', badge: 7 },
  { id: 'cleared', label: 'Cleared Students', icon: '◉', section: 'records' },
];

// Admin nav items
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', section: 'main' },
  { id: 'students', label: 'Students', icon: '◎', section: 'manage' },
  { id: 'teachers', label: 'Faculty', icon: '⊙', section: 'manage' },
  { id: 'clearance', label: 'Clearance Status', icon: '◈', section: 'manage' },
  { id: 'reports', label: 'Reports', icon: '⊡', section: 'reports' },
  { id: 'settings', label: 'Settings', icon: '⊗', section: 'system' },
];

const NAV_MAP = {
  student: STUDENT_NAV,
  teacher: TEACHER_NAV,
  admin: ADMIN_NAV,
};

const SECTION_LABELS = {
  main: 'Main',
  records: 'Records',
  manage: 'Management',
  reports: 'Reports & Analytics',
  system: 'System',
};

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navItems = NAV_MAP[user?.role] || [];

  // Group by section
  const sections = {};
  navItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const roleLabel = {
    student: 'Student Portal',
    teacher: 'Faculty Portal',
    admin: 'Admin Panel',
  }[user?.role] || '';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="hero-grid" />

        {/* Brand */}
        <div className="sidebar-brand">
          <img 
            src="/STI_LOGO.jpg" 
            alt="STI Logo" 
            className="sidebar-brand-icon"
            style={{ 
              width: '38px', 
              height: '38px', 
              objectFit: 'contain',
              background: 'var(--white)',
              padding: '4px'
            }}
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">SCMS</span>
            <span className="sidebar-brand-tagline">{roleLabel}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-label">{SECTION_LABELS[section]}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                >
                  <span className="nav-item-icon" style={{ fontSize: '1.1rem' }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span className="nav-item-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ background: 'rgba(255,209,0,0.2)', color: 'var(--yellow)' }}>
              {user?.avatar}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost btn-icon"
              title="Logout"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}