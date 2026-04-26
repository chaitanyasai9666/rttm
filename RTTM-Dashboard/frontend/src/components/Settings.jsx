import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [alertEmail, setAlertEmail] = useState('');
  const [targetUrls, setTargetUrls] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [statusMsg, setStatusMsg] = useState('');
  const [testStatusMsg, setTestStatusMsg] = useState('');

  const fetchExistingData = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Settings
      const setResp = await fetch('http://localhost:5000/api/settings', { headers });
      if (setResp.ok) {
        const setData = await setResp.json();
        if (setData.receiver_email) setAlertEmail(setData.receiver_email);
      }

      // Fetch Target URLs
      const urlResp = await fetch('http://localhost:5000/api/target_urls', { headers });
      if (urlResp.ok) {
        const urlData = await urlResp.json();
        setTargetUrls(urlData.map(u => u.url).join('\n'));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchExistingData();
  }, []);

  // Sync theme with document class immediately
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const handleSaveEmail = async () => {
    setStatusMsg('Saving Email...');
    const token = localStorage.getItem('token') || '';
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    try {
      const settingsPayload = { email: alertEmail };
      const response = await fetch('http://localhost:5000/api/settings', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(settingsPayload) 
      });

      if (response.ok) {
        setStatusMsg('Email Saved Successfully!');
      } else {
        setStatusMsg('Failed to save email configuration.');
      }
      setTimeout(() => setStatusMsg(''), 3000);
      fetchExistingData();
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to save email.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSaveTargetUrls = async () => {
    setStatusMsg('Saving Target URLs...');
    const token = localStorage.getItem('token') || '';
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    try {
      const urlList = targetUrls.split('\n').map(s => s.trim()).filter(s => s);
      const response = await fetch('http://localhost:5000/api/target_urls/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(urlList)
      });

      if (response.ok) {
        setStatusMsg('Target URLs Saved Successfully!');
      } else {
        setStatusMsg('Failed to save Target URLs.');
      }
      setTimeout(() => setStatusMsg(''), 3000);
      fetchExistingData();
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to save Target URLs.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleTestEmail = async () => {
    setTestStatusMsg('Sending test...');
    const token = localStorage.getItem('token') || '';
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch('http://localhost:5000/api/test-email', { 
        method: 'POST', 
        headers 
      });

      if (response.ok) {
        setTestStatusMsg('Test Email Sent!');
      } else {
        setTestStatusMsg('Failed to send test email.');
      }
      setTimeout(() => setTestStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setTestStatusMsg('Network error.');
      setTimeout(() => setTestStatusMsg(''), 3000);
    }
  };

  return (
    <div className="card log-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '24px' }}>System Configuration</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Theme Mode Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Theme Mode</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                position: 'relative',
                width: '60px',
                height: '30px',
                borderRadius: '15px',
                border: 'none',
                backgroundColor: theme === 'light' ? '#4CAF50' : '#888',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: theme === 'light' ? '32px' : '2px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
            </span>
          </div>
        </div>

        {/* Email Configuration Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Alert Email Address</label>
          <input 
            type="email"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="operator@company.com"
            style={{
              width: '100%', padding: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
            <button 
              type="button" 
              onClick={handleSaveEmail}
              style={{
                padding: '10px 20px', 
                backgroundColor: '#2196F3', color: '#fff',
                border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
              Save Email
            </button>
            <button 
              type="button" 
              onClick={handleTestEmail}
              disabled={testStatusMsg === 'Sending test...'}
              style={{
                padding: '10px 20px', 
                backgroundColor: '#555', color: '#fff',
                border: 'none', borderRadius: '6px', fontWeight: 'bold', 
                cursor: testStatusMsg === 'Sending test...' ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}>
              {testStatusMsg === 'Sending test...' ? 'Sending...' : 'Send Test Alert'}
            </button>
          </div>
        </div>

        {/* Target URLs Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target URLs (newline separated)</label>
          <textarea 
            rows="4" 
            value={targetUrls}
            onChange={(e) => setTargetUrls(e.target.value)}
            placeholder="https://example.com/logs&#10;https://pastebin.com/search"
            style={{
              width: '100%', padding: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '12px' }}>
          <button 
            type="button" 
            onClick={handleSaveTargetUrls}
            style={{
              padding: '12px 24px', 
              backgroundColor: 'var(--status-secure)', color: '#fff',
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>
            Save Target URLs
          </button>
        </div>

        {/* Status Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {statusMsg && <span style={{ color: 'var(--status-secure)', fontWeight: 'bold' }}>✓ {statusMsg}</span>}
          {testStatusMsg && <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{testStatusMsg}</span>}
        </div>

      </div>
    </div>
  );
};

export default Settings;
