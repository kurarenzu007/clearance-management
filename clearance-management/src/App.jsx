import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';
import './styles/global.css';

function AppContent() {
  const { user } = useAuth();
  return user ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}