import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const ROLES = [
  { id: 'student', label: 'Student', icon: '◎' },
  { id: 'teacher', label: 'Faculty', icon: '⊙' },
  { id: 'admin', label: 'Admin', icon: '⊗' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    setFormError('');
    try {
      await login({ email, password });
    } catch (err) {
      setFormError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      {/* Left Hero */}
      <div className="login-hero">
        <div className="hero-grid" />
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">
            <span>✦</span>
            Digital First · Paperless
          </div>

          <h1 className="hero-title">
            Student <span>Clearance</span><br />
            Made Simple.
          </h1>

          <p className="hero-description">
            Digitize and automate your clearance process. Students, faculty, and administrators can manage clearances seamlessly — anytime, anywhere.
          </p>

          <div className="hero-features stagger-children">
            {[
              { icon: '⚡', text: 'Real-time status updates' },
              { icon: '◈', text: 'Digital clearance certificates' },
              { icon: '◎', text: 'Multi-role access control' },
            ].map((f) => (
              <div key={f.text} className="hero-feature animate-fade-in">
                <div className="hero-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="hero-stats">
            {[
              { num: '1,248', label: 'Enrolled Students' },
              { num: '96%', label: 'Digital Adoption' },
              { num: '3×', label: 'Faster Clearance' },
            ].map((s) => (
              <div key={s.label}>
                <div className="hero-stat-number">{s.num}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel animate-slide-left">
        <div className="login-form-logo">
          <img 
            src="/STI_LOGO.jpg" 
            alt="STI Logo" 
            className="login-logo-mark"
            style={{ 
              width: '52px', 
              height: '52px', 
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)'
            }}
          />
          <span className="login-logo-text">SCMS</span>
        </div>

        <div className="login-form-header">
          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-sub">Sign in to your portal to continue</p>
        </div>

        {/* Role selector */}
        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.id}
              className={`role-tab ${role === r.id ? 'active' : ''}`}
              onClick={() => handleRoleChange(r.id)}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="email"
                type="email"
                className="form-input input-with-icon"
                placeholder={`${role}@school.edu`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {formError && (
            <div style={{
              background: 'var(--red-light)',
              color: 'var(--red)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ borderTopColor: 'white', width: 18, height: 18 }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          Student Clearance Management System &copy; 2024
        </div>
      </div>
    </div>
  );
}