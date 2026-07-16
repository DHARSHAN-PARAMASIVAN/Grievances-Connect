import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import HodDashboard from './pages/HodDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Route guard to check authentication
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Sidebar / Layout Wrapper
const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--primary))' }}>
            🛡️ GrievanceConnect
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', marginTop: '4px' }}>College Grievance System</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-input))',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid hsl(var(--border))',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Logged in as</p>
            <p style={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</p>
            <span className={`badge badge-${user.role ? user.role.toLowerCase() : 'pending'}`} style={{ marginTop: '8px', fontSize: '0.65rem' }}>
              {user.role}
            </span>
          </div>
        </nav>

        <button 
          onClick={toggleTheme} 
          className="btn btn-outline" 
          style={{ 
            marginTop: 'auto', 
            marginBottom: '12px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px' 
          }}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', borderColor: 'hsl(var(--accent-rose) / 0.3)', color: 'hsl(var(--accent-rose))' }}>
          Sign Out
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Role-based router redirection
const RoleRedirector = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
  if (user.role === 'HOD') return <Navigate to="/hod" replace />;
  if (user.role === 'PRINCIPAL') return <Navigate to="/principal" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Redirection Route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleRedirector />
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout>
              <StudentDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Staff Routes */}
        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <DashboardLayout>
              <StaffDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* HOD Routes */}
        <Route path="/hod" element={
          <ProtectedRoute allowedRoles={['HOD']}>
            <DashboardLayout>
              <HodDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Principal Routes */}
        <Route path="/principal" element={
          <ProtectedRoute allowedRoles={['PRINCIPAL']}>
            <DashboardLayout>
              <PrincipalDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}

export default App;
