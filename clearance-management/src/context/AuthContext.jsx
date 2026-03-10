import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'scms_user';

const MOCK_USERS = {
  student: {
    id: 'STU-2024-001',
    name: 'Maria Santos',
    email: 'maria.santos@university.edu',
    role: 'student',
    course: 'BS Computer Science',
    year: '3rd Year',
    section: 'CS-3A',
    avatar: 'MS',
  },
  teacher: {
    id: 'FAC-2024-042',
    name: 'Prof. Juan Dela Cruz',
    email: 'j.delacruz@university.edu',
    role: 'teacher',
    department: 'College of Engineering',
    subjects: ['CS101', 'CS201', 'CS301'],
    avatar: 'JD',
  },
  admin: {
    id: 'ADM-2024-001',
    name: 'Dr. Reyes',
    email: 'admin@university.edu',
    role: 'admin',
    department: 'Registrar',
    avatar: 'DR',
  },
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const { role, password } = credentials;

      if (password !== 'demo123') {
        throw new Error('Invalid credentials. Use password: demo123');
      }

      const mockUser = MOCK_USERS[role];
      if (!mockUser) throw new Error('Invalid role selected');

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}