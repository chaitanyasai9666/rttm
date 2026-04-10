import React, { useState, useEffect } from 'react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [activeKeywords, setActiveKeywords] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

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

        const alertResp = await fetch('http://localhost:5000/api/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (alertResp.ok) {
          const alertData = await alertResp.json();
          setRecentAlerts(alertData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
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
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No recent threats detected.
                  </td>
                </tr>
              ) : (
                recentAlerts.map(alert => (
                  <tr key={alert.id}>
                    <td>{new Date(alert.timestamp).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-warning">{alert.keyword}</span>
                    </td>
                    <td>{alert.source}</td>
                    <td>
                      <a href={alert.url} target="_blank" rel="noopener noreferrer" className="link-text" style={{ wordBreak: 'break-all' }}>
                        {alert.url}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
