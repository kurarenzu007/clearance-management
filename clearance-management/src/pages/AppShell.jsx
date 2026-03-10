import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './student/StudentDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import AdminDashboard from './admin/AdminDashboard';
import '../styles/layout.css';

const DEFAULT_TAB = {
  student: 'dashboard',
  teacher: 'dashboard',
  admin: 'dashboard',
};

export default function AppShell() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB[user?.role] || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (user?.role) {
      case 'student': return <StudentDashboard activeTab={activeTab} />;
      case 'teacher': return <TeacherDashboard activeTab={activeTab} />;
      case 'admin':   return <AdminDashboard activeTab={activeTab} />;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Topbar
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}