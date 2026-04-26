import React, { useState } from 'react';

const AutoScanControl = () => {
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [interval, setInterval] = useState('1'); // Default to 1 minute
  const [statusMsg, setStatusMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleAutoScan = async () => {
    setIsProcessing(true);
    setStatusMsg('');
    const token = localStorage.getItem('token') || '';
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    try {
      if (!isAutoEnabled) {
        // Start Auto-Scan
        const response = await fetch('http://localhost:5000/api/auto-scan/start', {
          method: 'POST',
          headers,
          body: JSON.stringify({ interval: parseInt(interval) })
        });
        
        if (response.ok) {
          setIsAutoEnabled(true);
          setStatusMsg(`Auto-Scan activated (Every ${interval} min)`);
        } else {
          setStatusMsg('Failed to start auto-scan.');
        }
      } else {
        // Stop Auto-Scan
        const response = await fetch('http://localhost:5000/api/auto-scan/stop', {
          method: 'POST',
          headers
        });
        
        if (response.ok) {
          setIsAutoEnabled(false);
          setStatusMsg('Auto-Scan deactivated.');
        } else {
          setStatusMsg('Failed to stop auto-scan.');
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      marginBottom: '1rem', 
      padding: '1.5rem', 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      borderRadius: '8px', 
      border: isAutoEnabled ? '1px solid var(--status-warning)' : '1px solid rgba(255,255,255,0.1)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Automated Threat Intelligence</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Run continuous background scans on a schedule.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Conditional Rendering for Interval Select */}
          {isAutoEnabled && (
            <select 
              value={interval}
              onChange={(e) => {
                // If they change interval while running, we don't auto-restart here to keep it simple, 
                // but we could. For now, it requires them to toggle off and on.
                setInterval(e.target.value);
              }}
              disabled={isAutoEnabled} // Disable changing interval while running
              style={{
                padding: '10px 14px', borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontFamily: 'inherit',
                outline: 'none', cursor: isAutoEnabled ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="1">Every 1 minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
            </select>
          )}

          {!isAutoEnabled && (
             <select 
             value={interval}
             onChange={(e) => setInterval(e.target.value)}
             style={{
               padding: '10px 14px', borderRadius: '4px',
               backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
               color: 'var(--text-primary)', fontFamily: 'inherit',
               outline: 'none', cursor: 'pointer'
             }}
           >
             <option value="1">Every 1 minute</option>
             <option value="5">Every 5 minutes</option>
             <option value="10">Every 10 minutes</option>
           </select>
          )}

          <button 
            onClick={toggleAutoScan} 
            disabled={isProcessing}
            style={{
              backgroundColor: isAutoEnabled ? 'var(--status-alert)' : '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'background-color 0.2s ease',
              minWidth: '180px'
            }}
          >
            {isProcessing ? 'Processing...' : (isAutoEnabled ? 'Deactivate Auto-Search' : 'Enable Auto-Search')}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: isAutoEnabled ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255,255,255,0.05)', 
          color: isAutoEnabled ? 'var(--status-warning)' : 'var(--text-secondary)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          {isAutoEnabled ? '⚡ ' : 'ℹ '}{statusMsg}
        </div>
      )}
    </div>
  );
};

export default AutoScanControl;
