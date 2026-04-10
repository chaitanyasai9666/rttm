import React, { useState, useEffect } from 'react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch('http://localhost:5000/api/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };
    fetchAlerts();
    
    // Auto-refresh alerts every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card log-card">
      <h3 style={{ marginBottom: '16px' }}>Active Alerts</h3>
      <div className="alerts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No active alerts detected.</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} style={{ 
              padding: '16px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderLeft: '4px solid var(--status-alert)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Threat Match Detected</strong>
                <small style={{ color: 'var(--text-secondary)' }}>{new Date(alert.timestamp).toLocaleString()}</small>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Keyword <strong style={{ color: 'var(--status-alert)' }}>"{alert.keyword}"</strong> found on {alert.source}
              </p>
              <a href={alert.url} target="_blank" rel="noopener noreferrer" className="link-text" style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                {alert.url}
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
