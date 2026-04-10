import React from 'react';

const Alerts = () => {
  const alerts = [
    { id: 1, severity: 'High', message: 'Keyword "Confidential Project X" found on pastebin.com', time: '10 mins ago' },
    { id: 2, severity: 'Medium', message: 'Target URL returned HTTP 500 continuously for 1 hour', time: '1 hour ago' },
    { id: 3, severity: 'Low', message: 'Scraping delay increased by 200% on darkweb.forum', time: '3 hours ago' }
  ];

  return (
    <div className="card log-card">
      <h3 style={{ marginBottom: '16px' }}>Active Alerts</h3>
      <div className="alerts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alerts.map(alert => (
          <div key={alert.id} style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderLeft: `4px solid ${alert.severity === 'High' ? 'var(--status-alert)' : alert.severity === 'Medium' ? 'var(--status-warning)' : 'var(--text-secondary)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{alert.severity} Severity</strong>
              <small style={{ color: 'var(--text-secondary)' }}>{alert.time}</small>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
