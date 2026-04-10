import React, { useState, useEffect } from 'react';

const Keywords = () => {
  const [keywords, setKeywords] = useState([]);
  const [newKw, setNewKw] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchKeywords = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/keywords', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKeywords(data);
      }
    } catch (err) {
      console.error("Failed to fetch keywords", err);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKw.trim()) return;

    setStatusMsg('Adding...');
    const token = localStorage.getItem('token') || '';
    try {
      const resp = await fetch('http://localhost:5000/api/keywords', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ keyword: newKw.trim(), priority: newPriority })
      });
      
      if (resp.ok) {
        setNewKw('');
        setNewPriority('Medium');
        setStatusMsg('Added successfully.');
        fetchKeywords();
      } else {
        setStatusMsg('Failed to add.');
      }
    } catch (err) {
      setStatusMsg('Error adding.');
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token') || '';
    try {
      await fetch('http://localhost:5000/api/keywords', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ id })
      });
      fetchKeywords();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'var(--status-alert)';
      case 'Medium': return 'var(--status-warning)';
      case 'Low': return 'var(--status-secure)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="card log-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '24px' }}>Keywords Management</h3>
      
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New Keyword</label>
          <input 
            type="text"
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            placeholder="e.g., project source code"
            style={{
              padding: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Priority</label>
          <select 
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            style={{
              padding: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontFamily: 'inherit'
            }}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <button 
          type="submit" 
          style={{
            padding: '12px 24px', 
            backgroundColor: 'var(--status-secure)', color: '#000',
            border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', height: '45px'
          }}>
          Add
        </button>
      </form>

      {statusMsg && <div style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>{statusMsg}</div>}

      <div className="table-container">
        <table className="threat-table">
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Priority</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No keywords configured.</td></tr>
            ) : (
              keywords.map(kw => (
                <tr key={kw.id}>
                  <td style={{ fontWeight: 500 }}>{kw.keyword}</td>
                  <td>
                    <span style={{
                      color: getPriorityColor(kw.priority),
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem'
                    }}>
                      {kw.priority || 'Medium'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(kw.id)}
                      style={{ 
                        backgroundColor: 'transparent', color: 'var(--status-alert)', 
                        border: '1px solid var(--status-alert)', borderRadius: '4px', 
                        padding: '6px 12px', cursor: 'pointer' 
                      }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Keywords;
