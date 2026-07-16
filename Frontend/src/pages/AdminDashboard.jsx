import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import GrievanceDiscussion from '../components/GrievanceDiscussion';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'create-user', 'ledger'
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [modalTab, setModalTab] = useState('history'); // 'history' or 'comments'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state (Ledger tab)
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterAnon, setFilterAnon] = useState('ALL');
  const [sortByDate, setSortByDate] = useState('DESC');

  // Form states (Create User)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Edit User State
  const [selectedEditUser, setSelectedEditUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editRegisterNumber, setEditRegisterNumber] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const startEditUser = (user) => {
    setSelectedEditUser(user);
    setEditFullName(user.fullName || '');
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditRoleId(user.role ? user.role.id : '');
    setEditDepartmentId(user.department ? user.department.id : '');
    setEditRegisterNumber(user.registerNumber || '');
    setEditEmployeeId(user.employeeId || '');
    setEditPhone(user.phone || '');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editFullName || !editEmail || !editRoleId) {
      toast.error('Please fill out all required user fields');
      return;
    }

    setLoading(true);
    try {
      const selectedRoleObj = roles.find(r => r.id === Number(editRoleId));
      const roleName = selectedRoleObj ? selectedRoleObj.roleName : '';

      await api.put(`/admin/users/${selectedEditUser.id}`, {
        fullName: editFullName,
        email: editEmail,
        password: editPassword,
        role: roleName,
        departmentId: editDepartmentId ? Number(editDepartmentId) : null,
        registerNumber: editRegisterNumber || null,
        employeeId: editEmployeeId || null,
        phone: editPhone || null
      });

      toast.success('User profile updated successfully!');
      setSelectedEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete or decouple all associated grievances, history, comments, and notifications.')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User account deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user account');
    } finally {
      setLoading(false);
    }
  };

  // Analytics states
  const [analytics, setAnalytics] = useState({
    departmentWiseComplaints: {},
    monthlyComplaints: {},
    categoryWiseComplaints: {},
    resolutionPercentage: 0,
    averageResponseTimeHours: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchGrievances();
    fetchMetadata();
    fetchAnalytics();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/all-users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system users');
    }
  };

  const fetchGrievances = async () => {
    try {
      const res = await api.get('/admin/grievances');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system ledger');
    }
  };

  const fetchMetadata = async () => {
    try {
      const deptRes = await api.get('/admin/departments');
      setDepartments(deptRes.data);
      if (deptRes.data.length > 0) {
        setDepartmentId(deptRes.data[0].id);
      }

      const roleRes = await api.get('/admin/roles');
      setRoles(roleRes.data);
      if (roleRes.data.length > 0) {
        setRoleId(roleRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !roleId) {
      toast.error('Please fill out all required user fields');
      return;
    }

    setLoading(true);
    try {
      const selectedRoleObj = roles.find(r => r.id === Number(roleId));
      const roleName = selectedRoleObj ? selectedRoleObj.roleName : '';

      await api.post('/admin/users', {
        fullName,
        email,
        password,
        role: roleName,
        departmentId: departmentId ? Number(departmentId) : null
      });

      toast.success('User profile created successfully!');
      setFullName('');
      setEmail('');
      setPassword('');
      fetchUsers();
      setActiveTab('users');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  };

  const viewGrievanceDetails = async (g) => {
    setSelectedGrievance(g);
    setModalTab('history');
    try {
      const res = await api.get(`/student/grievances/${g.id}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load status history');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN': return 'badge-pending';
      case 'PENDING': return 'badge-pending';
      case 'IN_PROGRESS': return 'badge-progress';
      case 'RESOLVED': return 'badge-resolved';
      case 'ESCALATED_TO_HOD': return 'badge-escalated';
      case 'ESCALATED_TO_PRINCIPAL': return 'badge-escalated';
      case 'CLOSED': return 'badge-closed';
      default: return 'badge-pending';
    }
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'HIGH': return 'badge-escalated';
      case 'MEDIUM': return 'badge-progress';
      case 'LOW': return 'badge-closed';
      default: return 'badge-progress';
    }
  };

  // Perform advanced client-side filtering for ledger list
  const filteredGrievances = grievances.filter(g => {
    if (filterStatus !== 'ALL' && g.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && g.category !== filterCategory) return false;
    if (filterPriority !== 'ALL' && g.priority !== filterPriority) return false;
    if (filterDept !== 'ALL' && g.departmentName !== filterDept) return false;
    if (filterAnon !== 'ALL') {
      if (filterAnon === 'ANON' && !g.anonymous) return false;
      if (filterAnon === 'NON-ANON' && g.anonymous) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortByDate === 'DESC' ? dateB - dateA : dateA - dateB;
  });

  // Department counts mappings helper
  const deptCounts = Object.entries(analytics.departmentWiseComplaints || {});
  const maxDeptCount = Math.max(...deptCounts.map(([_, count]) => count), 1);

  // Monthly complaints helper
  const monthlyCounts = Object.entries(analytics.monthlyComplaints || {});
  const maxMonthlyCount = Math.max(...monthlyCounts.map(([_, count]) => count), 1);

  // Category complaints helper
  const categoryCounts = Object.entries(analytics.categoryWiseComplaints || {});
  const highestCategory = categoryCounts.length > 0 
    ? categoryCounts.sort((a, b) => b[1] - a[1])[0] 
    : ['N/A', 0];

  return (
    <div>
      <header className="header">
        <div>
          <h1>College Administration Control</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>System metrics, accounts provision, and grievance ledger</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell />
          <div style={{ display: 'flex', gap: '8px', background: 'hsl(var(--bg-input))', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }} 
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              👥 Manage Users
            </button>
            <button 
              onClick={() => setActiveTab('create-user')} 
              className={`btn ${activeTab === 'create-user' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              ➕ Create User
            </button>
            <button 
              onClick={() => { setActiveTab('ledger'); fetchGrievances(); }} 
              className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              📋 Ledger View
            </button>
          </div>
        </div>
      </header>

      {/* Analytics Dashboard tab */}
      {activeTab === 'analytics' && (
        <div>
          {/* Stats Bar */}
          <div className="stats-bar" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px' }}>
            <div className="stat-card">
              <h3>{grievances.length}</h3>
              <p>Total Registered</p>
            </div>
            <div className="stat-card">
              <h3>{grievances.filter(g => g.status === 'OPEN').length}</h3>
              <p>Open / Pending</p>
            </div>
            <div className="stat-card">
              <h3>{grievances.filter(g => g.status === 'IN_PROGRESS').length}</h3>
              <p>In Progress</p>
            </div>
            <div className="stat-card">
              <h3>{grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length}</h3>
              <p>Resolved / Closed</p>
            </div>
            <div className="stat-card">
              <h3>{analytics.averageResponseTimeHours ? `${analytics.averageResponseTimeHours.toFixed(1)} Hrs` : '0 Hrs'}</h3>
              <p>Avg Response Time</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Department Wise Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>🏢 Department-Wise Complaints</h3>
              {deptCounts.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>No department statistics recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deptCounts.map(([dept, count]) => {
                    const percentage = (count / maxDeptCount) * 100;
                    return (
                      <div key={dept} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span>{dept}</span>
                          <span style={{ fontWeight: 'bold', color: 'hsl(var(--primary-hover))' }}>{count} complaints</span>
                        </div>
                        <div style={{ height: '12px', backgroundColor: 'hsl(var(--border))', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%)',
                            borderRadius: '6px',
                            transition: 'width 1s ease-out'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resolution Rate & Top Category Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '24px' }}>
                {/* SVG circular progress */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg width="130" height="130" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                    <circle 
                      cx="60" cy="60" r="50" fill="none" 
                      stroke="hsl(var(--primary))" strokeWidth="10" 
                      strokeDasharray="314.15" 
                      strokeDashoffset={314.15 - (314.15 * (analytics.resolutionPercentage || 0)) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                    <text x="60" y="66" textAnchor="middle" fill="white" fontSize="1.3rem" fontWeight="bold" fontFamily="var(--font-display)">
                      {Math.round(analytics.resolutionPercentage || 0)}%
                    </text>
                  </svg>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginTop: '12px', fontWeight: 'bold' }}>Resolution Success Rate</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'hsl(var(--bg-input))', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border))' }}>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Top Complaint Category</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'hsl(var(--accent-amber))', marginTop: '4px' }}>{highestCategory[0]}</p>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{highestCategory[1]} total tickets</span>
                  </div>
                </div>
              </div>

              {/* Resolution time indicator card */}
              <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--primary-glow) / 0.1) 100%)' }}>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'white' }}>⏱️ Average Response & Close Times</h4>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>How quickly complaints are addressed by staff:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
                  <span>System Average Resolution Time:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'hsl(var(--primary-hover))' }}>
                    {analytics.averageResponseTimeHours ? `${analytics.averageResponseTimeHours.toFixed(1)} Hours` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly complaints vertical columns */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>📈 Monthly Complaints Inflow</h3>
            {monthlyCounts.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>No historical monthly records exist.</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', padding: '20px 0 10px 0', borderBottom: '1px solid hsl(var(--border))' }}>
                {monthlyCounts.map(([month, count]) => {
                  const heightVal = (count / maxMonthlyCount) * 130; // scale limit to 130px
                  return (
                    <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary-hover))', fontWeight: 'bold', marginBottom: '8px' }}>{count}</span>
                      <div style={{
                        width: '32px',
                        height: `${heightVal}px`,
                        background: 'linear-gradient(180deg, hsl(var(--primary-hover)) 0%, hsl(var(--primary) / 0.5) 100%)',
                        borderRadius: '6px 6px 0 0',
                        boxShadow: '0 0 10px hsl(var(--primary) / 0.3)',
                        transition: 'height 1s ease-out'
                      }}></div>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '12px', whiteSpace: 'nowrap' }}>
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>System User Registry</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Department</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px' }}>{u.fullName}</td>
                    <td style={{ padding: '12px' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-progress" style={{ fontSize: '0.7rem' }}>
                        {u.role ? u.role.roleName : 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{u.department ? u.department.departmentName : 'All College'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => startEditUser(u)} 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: '8px', borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-hover))' }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)} 
                        className="btn btn-outline" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'hsl(var(--accent-rose))', color: 'hsl(var(--accent-rose))' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Tab */}
      {activeTab === 'create-user' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Provision New Account</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-control"
                placeholder="User Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="user@college.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Temporary Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="roleId">Role Authority</label>
                <select
                  id="roleId"
                  className="form-control"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.roleName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="departmentId">Department Bound</label>
                <select
                  id="departmentId"
                  className="form-control"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">All Departments (e.g. Principal / Admin)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.departmentName}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Provision User Account'}
            </button>
          </form>
        </div>
      )}

      {/* Ledger View Tab */}
      {activeTab === 'ledger' && (
        <div>
          {/* Advanced Filtering Panel */}
          <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔍 Advanced Filters
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Status</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ESCALATED_TO_HOD">Escalated to HOD</option>
                  <option value="ESCALATED_TO_PRINCIPAL">Escalated to Principal</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Category</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="EXAMINATION">Examination</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Priority</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Department</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
                  ))}
                </select>
              </div>

              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Visibility</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterAnon} onChange={(e) => setFilterAnon(e.target.value)}>
                  <option value="ALL">All Visibility</option>
                  <option value="ANON">Anonymous Only</option>
                  <option value="NON-ANON">Non-Anonymous Only</option>
                </select>
              </div>

              <div style={{ flexGrow: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Sort By Date</label>
                <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={sortByDate} onChange={(e) => setSortByDate(e.target.value)}>
                  <option value="DESC">Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>College-Wide Complaints Ledger</h2>
            {filteredGrievances.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
                No grievances match search parameters.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredGrievances.map((g) => (
                  <div 
                    key={g.id} 
                    onClick={() => viewGrievanceDetails(g)}
                    style={{
                      padding: '16px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      background: 'hsl(var(--bg-input))'
                    }}
                    className="grievance-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1.1rem' }}>{g.title}</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`badge ${getPriorityBadgeClass(g.priority)}`} style={{ fontSize: '0.65rem' }}>{g.priority}</span>
                        <span className={`badge ${getStatusBadgeClass(g.status)}`}>{g.status}</span>
                      </div>
                    </div>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {g.description}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      <span>Category: <strong>{g.category}</strong></span>
                      <span>Department: <strong>{g.departmentName || 'General'}</strong></span>
                      <span>Student: <strong>{g.studentName || 'Anonymous'}</strong></span>
                      <span>Date: {new Date(g.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details & Comments Modal */}
      {selectedGrievance && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedGrievance(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
            >
              &times;
            </button>
            <h2 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '20px' }}>
              Grievance Details
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={`badge ${getPriorityBadgeClass(selectedGrievance.priority)}`}>{selectedGrievance.priority}</span>
                <span className={`badge ${getStatusBadgeClass(selectedGrievance.status)}`}>{selectedGrievance.status}</span>
              </div>
            </h2>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid hsl(var(--border))', marginBottom: '16px' }}>
              <button 
                onClick={() => setModalTab('history')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'history' ? '2px solid hsl(var(--primary))' : 'none',
                  color: modalTab === 'history' ? 'white' : 'hsl(var(--text-secondary))',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📜 Status History
              </button>
              <button 
                onClick={() => setModalTab('comments')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'comments' ? '2px solid hsl(var(--primary))' : 'none',
                  color: modalTab === 'comments' ? 'white' : 'hsl(var(--text-secondary))',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                💬 Discussion Feed
              </button>
            </div>

            {modalTab === 'history' ? (
              <div>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Title</p>
                      <p style={{ fontWeight: 'bold' }}>{selectedGrievance.title}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Student Submitting</p>
                      <p>{selectedGrievance.studentName || 'Anonymous'}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Description</p>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>{selectedGrievance.description}</p>
                  </div>
                  {selectedGrievance.proofFileName && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Attachment</p>
                      <a 
                        href={`http://localhost:8080/api/files/${selectedGrievance.proofFileName}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-outline"
                        style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        📄 View Attachment
                      </a>
                    </div>
                  )}
                </div>

                <hr style={{ borderColor: 'hsl(var(--border))', margin: '20px 0' }} />

                <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>Status History Timeline</h3>
                {history.length === 0 ? (
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>No history records found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid hsl(var(--border))', paddingLeft: '20px', marginLeft: '10px' }}>
                    {history.map((h, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-27px',
                          top: '4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'hsl(var(--primary))'
                        }}></div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          Status changed from <span className={`badge ${getStatusBadgeClass(h.oldStatus)}`}>{h.oldStatus}</span> to <span className={`badge ${getStatusBadgeClass(h.newStatus)}`}>{h.newStatus}</span>
                        </p>
                        {h.remarks && (
                          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginTop: '4px', fontStyle: 'italic' }}>
                            &ldquo;{h.remarks}&rdquo;
                          </p>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '2px' }}>
                          By {h.changedBy || 'System Escalation'} on {new Date(h.changedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <GrievanceDiscussion grievanceId={selectedGrievance.id} />
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedEditUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedEditUser(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}
            >
              &times;
            </button>
            <h2 style={{ marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Edit User Profile</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="editFullName">Full Name</label>
                <input
                  id="editFullName"
                  type="text"
                  className="form-control"
                  placeholder="User Full Name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editEmail">Email Address</label>
                <input
                  id="editEmail"
                  type="email"
                  className="form-control"
                  placeholder="user@college.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editPassword">New Password (leave blank to keep current)</label>
                <input
                  id="editPassword"
                  type="password"
                  className="form-control"
                  placeholder="Enter new password if changing"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editRoleId">Role Authority</label>
                  <select
                    id="editRoleId"
                    className="form-control"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editDepartmentId">Department Bound</label>
                  <select
                    id="editDepartmentId"
                    className="form-control"
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                  >
                    <option value="">All Departments (e.g. Principal / Admin)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="editRegisterNumber">Register Number (Students Only)</label>
                  <input
                    id="editRegisterNumber"
                    type="text"
                    className="form-control"
                    placeholder="Register Number"
                    value={editRegisterNumber}
                    onChange={(e) => setEditRegisterNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="editEmployeeId">Employee ID (Staff/HOD/Principal)</label>
                  <input
                    id="editEmployeeId"
                    type="text"
                    className="form-control"
                    placeholder="Employee ID"
                    value={editEmployeeId}
                    onChange={(e) => setEditEmployeeId(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editPhone">Phone Number</label>
                <input
                  id="editPhone"
                  type="text"
                  className="form-control"
                  placeholder="Phone Number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedEditUser(null)} 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
