import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

function GrievanceDiscussion({ grievanceId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [grievanceId]);

  const fetchComments = async () => {
    setFetching(true);
    try {
      const res = await api.get(`/grievances/${grievanceId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load comments');
    } finally {
      setFetching(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/grievances/${grievanceId}/comments`, {
        commentText: newComment.trim()
      });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAiDraft = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/grievances/${grievanceId}/ai-suggest`);
      setNewComment(res.data.aiDraft);
      toast.success('AI resolution reply drafted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate AI suggestion');
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', background: 'hsl(var(--bg-input))', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Discussion Feed</span>
        <button onClick={fetchComments} style={{ background: 'none', border: 'none', color: 'hsl(var(--primary-hover))', fontSize: '0.8rem', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Message List */}
      <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fetching && comments.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem' }}>Loading discussion...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem', marginTop: '20px' }}>
            No comments yet. Start the conversation below!
          </p>
        ) : (
          comments.map((c) => {
            const isMe = c.senderName === user.name;
            return (
              <div 
                key={c.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '2px', display: 'block' }}>
                  {c.senderName} ({c.senderRole})
                </span>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '0px' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '0px',
                  backgroundColor: isMe ? 'hsl(var(--primary) / 0.85)' : 'hsl(var(--border))',
                  border: isMe ? 'none' : '1px solid hsl(var(--border))',
                  color: 'white',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {c.commentText}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* AI Assistant draft helper */}
      {user.role !== 'STUDENT' && (
        <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'flex-start', background: 'hsl(var(--bg-card))', borderTop: '1px solid hsl(var(--border) / 0.5)' }}>
          <button
            type="button"
            onClick={handleAiDraft}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 0'
            }}
          >
            ✨ AI Assistant: Draft Resolution Reply
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handlePostComment} style={{ padding: '12px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Type your message here..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={loading}
          style={{ flexGrow: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !newComment.trim()}
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default GrievanceDiscussion;
