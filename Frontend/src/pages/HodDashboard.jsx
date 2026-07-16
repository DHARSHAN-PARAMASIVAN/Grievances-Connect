import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import GrievanceDiscussion from '../components/GrievanceDiscussion';

function HodDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [modalTab, setModalTab] = useState('history'); // 'history' or 'comments'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAnon, setFilterAnon] = useState('ALL');
  const [sortByDate, setSortByDate] = useState('DESC');

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      const res = await api.get('/hod/grievances');
      setGrievances(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department grievances');
    }
  };

  const handleAction = async (id, action) => {
    setLoading(true);
    try {
      let endpoint = `/hod/grievances/${id}/resolve`;
      if (action === 'escalate') endpoint = `/hod/grievances/${id}/escalate`;

      const res = await api.put(endpoint);
      toast.success(`Grievance successfully updated to ${res.data.status}`);
      
      fetchGrievances();
      if (selectedGrievance && selectedGrievance.id === id) {
        viewGrievanceDetails(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to process action');
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

  return (
    <div>
      <header className="header">
        <div>
          <h1>HOD Dashboard</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>Manage and escalate department-level grievances</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NotificationBell />
        </div>
      </header>

      {/* Stats Summary */}
      <div className="stats-bar">
        <div className="stat-card">
          <h3>{grievances.length}</h3>
          <p>Total Departmental</p>
        </div>
        <div className="stat-card">
          <h3>{grievances.filter(g => g.status === 'ESCALATED_TO_HOD' || g.status === 'ESCALATED').length}</h3>
          <p>Escalated to You</p>
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

      {/* Advanced Filtering Panel */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 Advanced Filters
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flexGrow: 1, minWidth: '130px' }}>
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

          <div style={{ flexGrow: 1, minWidth: '130px' }}>
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

          <div style={{ flexGrow: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Priority</label>
            <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div style={{ flexGrow: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Visibility</label>
            <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={filterAnon} onChange={(e) => setFilterAnon(e.target.value)}>
              <option value="ALL">All Visibility</option>
              <option value="ANON">Anonymous Only</option>
              <option value="NON-ANON">Non-Anonymous Only</option>
            </select>
          </div>

          <div style={{ flexGrow: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Sort By Date</label>
            <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={sortByDate} onChange={(e) => setSortByDate(e.target.value)}>
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Departmental Grievances</h2>
        {filteredGrievances.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
            No grievances match your filters.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredGrievances.map((g) => (
              <div 
                key={g.id} 
                style={{
                  padding: '18px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--bg-input))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div 
                  onClick={() => viewGrievanceDetails(g)}
                  style={{ cursor: 'pointer', flexGrow: 1 }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
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
                    <span>Student: <strong>{g.studentName || 'Anonymous'}</strong></span>
                    <span>Date: {new Date(g.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* HOD Specific Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                  {g.status === 'ESCALATED_TO_HOD' && (
                    <>
                      <button 
                        onClick={() => handleAction(g.id, 'resolve')}
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem', padding: '8px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                        disabled={loading}
                      >
                        ✅ Resolve
                      </button>
                      <button 
                        onClick={() => handleAction(g.id, 'escalate')}
                        className="btn btn-outline"
                        style={{ fontSize: '0.85rem', padding: '8px 12px', color: 'hsl(var(--accent-rose))', borderColor: 'hsl(var(--accent-rose) / 0.3)' }}
                        disabled={loading}
                      >
                        ⚠️ Escalate Principal
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}

export default HodDashboard;
