import { useState } from 'react';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  clearance: 'My Clearance',
  certificate: 'Clearance Certificate',
  students: 'Students',
  pending: 'Pending Requests',
  cleared: 'Cleared Students',
  teachers: 'Faculty Management',
  reports: 'Reports & Analytics',
  settings: 'System Settings',
};

export default function Topbar({ activeTab, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="topbar-title">{PAGE_TITLES[activeTab] || 'Dashboard'}</div>

      <div className="topbar-actions">
        <button
          className="notification-btn"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}