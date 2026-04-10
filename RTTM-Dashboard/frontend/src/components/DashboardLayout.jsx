import React from 'react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-grid">
      {/* Top row: High-level metrics */}
      <div className="card metrics-card">
        <h3>Active Threats</h3>
        <div className="metric-value text-alert">12</div>
      </div>
      <div className="card metrics-card">
        <h3>Active Keywords</h3>
        <div className="metric-value text-warning">15</div>
      </div>
      <div className="card metrics-card">
        <h3>URLs Scanned</h3>
        <div className="metric-value text-secure">12,450</div>
      </div>

      {/* Full width row: Live Logs or Tables */}
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
                <td>2026-04-02 01:23:45</td>
                <td><span className="badge badge-warning">project x</span></td>
                <td>pastebin</td>
                <td><a href="#" className="link-text">https://pastebin.com/xyzt</a></td>
              </tr>
              <tr>
                <td>2026-04-02 00:54:12</td>
                <td><span className="badge badge-warning">API_KEY</span></td>
                <td>github_gists</td>
                <td><a href="#" className="link-text">https://gist.github.com/abc</a></td>
              </tr>
              <tr>
                <td>2026-04-01 23:40:05</td>
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
