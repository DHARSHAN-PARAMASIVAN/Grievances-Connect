import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import GrievanceDiscussion from '../components/GrievanceDiscussion';

function StudentDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [modalTab, setModalTab] = useState('history'); // 'history' or 'comments'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [sortByDate, setSortByDate] = useState('DESC');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [priority, setPriority] = useState('MEDIUM');
  const [anonymous, setAnonymous] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchGrievances();
    fetchStaffList();
  }, []);

  const fetchGrievances = async () => {
    try {
      const res = await api.get('/student/grievances');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your grievances');
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/student/staff');
      setStaffList(res.data);
      if (res.data.length > 0) {
        setStaffId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departmental staff');
    }
  };

  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !staffId) {
      toast.error('Please fill out all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('anonymous', anonymous);
      formData.append('staffId', staffId);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      formData.append('studentName', anonymous ? 'Anonymous' : user.name);

      if (proofFile) {
        formData.append('proofFile', proofFile);
      }

      await api.post('/student/grievances', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Grievance submitted successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('ACADEMIC');
      setPriority('MEDIUM');
      setAnonymous(false);
      setProofFile(null);
      
      setActiveTab('list');
      fetchGrievances();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit grievance');
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

  // Perform advanced client-side filtering
  const filteredGrievances = grievances.filter(g => {
    if (filterStatus !== 'ALL' && g.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && g.category !== filterCategory) return false;
    if (filterPriority !== 'ALL' && g.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortByDate === 'DESC' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div>
      <header className="header">
        <div>
          <h1>Student Portal</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>Submit and track your grievances</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <NotificationBell />
          <button 
            onClick={() => setActiveTab(activeTab === 'list' ? 'new' : 'list')}
            className="btn btn-primary"
          >
            {activeTab === 'list' ? '✍️ Lodge New Grievance' : '📋 View My Grievances'}
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="stats-bar">
        <div className="stat-card">
          <h3>{grievances.length}</h3>
          <p>Total Filed</p>
        </div>
        <div className="stat-card">
          <h3>{grievances.filter(g => g.status === 'OPEN').length}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h3>{grievances.filter(g => g.status === 'IN_PROGRESS').length}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h3>{grievances.filter(g => g.status === 'RESOLVED').length}</h3>
          <p>Resolved</p>
        </div>
      </div>

      <div>
        {activeTab === 'list' ? (
          <div>
            {/* Advanced Filtering Panel */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔍 Advanced Filters
              </h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flexGrow: 1, minWidth: '150px' }}>
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

                <div style={{ flexGrow: 1, minWidth: '150px' }}>
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

                <div style={{ flexGrow: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Priority</label>
                  <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div style={{ flexGrow: 1, minWidth: '150px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Sort By Date</label>
                  <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={sortByDate} onChange={(e) => setSortByDate(e.target.value)}>
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="card">
              <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>My Grievances</h2>
              {filteredGrievances.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
                  No grievances match your filter criteria.
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
                        <span>Date: {new Date(g.createdAt).toLocaleDateString()}</span>
                        {g.anonymous && <span style={{ color: 'hsl(var(--accent-amber))' }}>⚠️ Anonymous</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: '750px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Lodge a New Grievance</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Grievance Title</label>
                <input
                  id="title"
                  type="text"
                  className="form-control"
                  placeholder="Brief summary of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Detailed Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows="6"
                  placeholder="Provide details about your grievance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category</label>
                  <select
                    id="category"
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="HOSTEL">Hostel</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="staffId">Assign to Staff</label>
                  <select
                    id="staffId"
                    className="form-control"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  >
                    {staffList.length === 0 ? (
                      <option value="">No Departmental Staff Configured</option>
                    ) : (
                      staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proofFile">Attachment (Proof / Documents)</label>
                <input
                  id="proofFile"
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="anonymous"
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="anonymous" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Submit Anonymously (Hide your name from staff)
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', marginTop: '16px' }}
                disabled={loading || staffList.length === 0}
              >
                {loading ? 'Submitting...' : 'Submit Grievance'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Details Modal */}
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
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Title</p>
                      <p style={{ fontWeight: 'bold' }}>{selectedGrievance.title}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Category</p>
                      <p>{selectedGrievance.category}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Description</p>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>{selectedGrievance.description}</p>
                  </div>
                  {selectedGrievance.aiSummary && (
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                      <p style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✨ AI Executive Summary
                      </p>
                      <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                        "{selectedGrievance.aiSummary}"
                      </p>
                      {selectedGrievance.aiSentiment && (
                        <p style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', margin: '6px 0 0 0' }}>
                          Detected Student Sentiment: <strong style={{ color: '#818cf8' }}>{selectedGrievance.aiSentiment}</strong>
                        </p>
                      )}
                    </div>
                  )}
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
    </div>
  );
}

export default StudentDashboard;
