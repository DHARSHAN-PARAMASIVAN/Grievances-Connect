import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaBell } from 'react-icons/fa';
import api from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);

    // Event listener to close dropdown on clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: 'hsl(var(--text-secondary))',
          fontSize: '1.4rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '50%',
          transition: 'var(--transition-fast)',
          position: 'relative'
        }}
        className="btn-outline"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: 'hsl(var(--accent-rose))',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 0 8px hsl(var(--accent-rose) / 0.5)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '45px',
          right: 0,
          width: '320px',
          backgroundColor: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'hsl(var(--bg-input))'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>Notifications</h4>
            {unreadCount > 0 && (
              <span className="badge badge-escalated" style={{ fontSize: '0.65rem' }}>{unreadCount} New</span>
            )}
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', padding: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
                No notifications yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid hsl(var(--border))',
                      fontSize: '0.85rem',
                      cursor: n.isRead ? 'default' : 'pointer',
                      backgroundColor: n.isRead ? 'transparent' : 'hsl(var(--primary-glow) / 0.1)',
                      transition: 'var(--transition-fast)'
                    }}
                    className="notification-item"
                  >
                    <p style={{ 
                      color: n.isRead ? 'hsl(var(--text-secondary))' : 'hsl(var(--text-primary))',
                      fontWeight: n.isRead ? 'normal' : '600',
                      lineHeight: '1.4'
                    }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
