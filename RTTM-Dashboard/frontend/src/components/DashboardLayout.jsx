import React, { useState, useEffect } from 'react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [activeKeywords, setActiveKeywords] = useState([]);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch('http://localhost:5000/api/keywords', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setActiveKeywords(data);
        }
      } catch (err) {
        console.error("Failed to fetch keywords", err);
      }
    };
    fetchKeywords();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'var(--status-alert)';
      case 'Medium': return 'var(--status-warning)';
      case 'Low': return 'var(--status-secure)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Top row: High-level metrics */}
      <div className="card metrics-card">
        <h3>Active Threats</h3>
        <div className="metric-value text-alert">12</div>
      </div>
      <div className="card metrics-card">
        <h3>Active Keywords</h3>
        <div className="metric-value text-warning">{activeKeywords.length}</div>
      </div>
      <div className="card metrics-card">
        <h3>URLs Scanned</h3>
        <div className="metric-value text-secure">12,450</div>
      </div>

      {/* Middle row: Active Keywords Display */}
      <div className="card log-card full-width" style={{ minHeight: 'auto' }}>
        <h3 style={{ marginBottom: '16px' }}>Configured Keywords</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {activeKeywords.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>No keywords active.</span>
          ) : (
            activeKeywords.map(kw => (
              <span key={kw.id} style={{
                border: `1px solid ${getPriorityColor(kw.priority)}`,
                color: getPriorityColor(kw.priority),
                backgroundColor: 'rgba(255,255,255,0.02)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                {kw.keyword}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Bottom row: Live Logs or Tables */}
      <div className="card log-card full-width">
        <h3 style={{ marginBottom: '16px' }}>Recent Threat Matches</h3>
        <div className="table-container">
          <table className="threat-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Keyword</th>
                <th>Source</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2026-04-10 12:23:45</td>
                <td><span className="badge badge-warning">project x</span></td>
                <td>pastebin</td>
                <td><a href="#" className="link-text">https://pastebin.com/xyzt</a></td>
              </tr>
              <tr>
                <td>2026-04-10 11:54:12</td>
                <td><span className="badge badge-warning">API_KEY</span></td>
                <td>github_gists</td>
                <td><a href="#" className="link-text">https://gist.github.com/abc</a></td>
              </tr>
              <tr>
                <td>2026-04-10 10:40:05</td>
                <td><span className="badge badge-warning">internal comms</span></td>
                <td>darkweb_forum</td>
                <td><span className="link-text text-secondary">onion://hidden...</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
