import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [targetUrls, setTargetUrls] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [scrapeInterval, setScrapeInterval] = useState('60');
  const [alertEmail, setAlertEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchExistingData = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch URLs
      const urlResp = await fetch('http://localhost:5000/api/target_urls', { headers });
      if (urlResp.ok) {
        const urlData = await urlResp.json();
        setTargetUrls(urlData.map(u => u.url).join('\n'));
      }

      // Fetch Settings
      const setResp = await fetch('http://localhost:5000/api/settings', { headers });
      if (setResp.ok) {
        const setData = await setResp.json();
        if (setData.theme) setTheme(setData.theme);
        if (setData.scrape_interval) setScrapeInterval(setData.scrape_interval);
        if (setData.alert_email) setAlertEmail(setData.alert_email);
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

  const handleSave = async () => {
    setStatusMsg('Saving...');
    const token = localStorage.getItem('token') || '';
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    try {
      // 1. Target URLs bulk sync
      const urlList = targetUrls.split('\n').map(s => s.trim()).filter(s => s);
      await fetch('http://localhost:5000/api/target_urls/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(urlList)
      });

      // 2. Settings key-value pairs
      const settingsPayload = {
        theme: theme,
        scrape_interval: scrapeInterval,
        alert_email: alertEmail
      };
      
      await fetch('http://localhost:5000/api/settings', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(settingsPayload) 
      });

      // Cache theme instantly for refreshes
      localStorage.setItem('theme', theme);

      setStatusMsg('Configuration saved successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      fetchExistingData(); // Refresh to catch actual state
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to save configuration.');
    }
  };

  return (
    <div className="card log-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '24px' }}>System Configuration</h3>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
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

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scraping Interval</label>
            <select 
              value={scrapeInterval}
              onChange={(e) => setScrapeInterval(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontFamily: 'inherit'
              }}
            >
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 60 seconds</option>
              <option value="300">Every 5 minutes</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 2 }}>
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
          </div>
        </div>

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
            onClick={handleSave}
            style={{
              padding: '12px 24px', 
              backgroundColor: 'var(--status-secure)', color: '#000',
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
            }}>
            Save Settings
          </button>
          {statusMsg && <span style={{ color: 'var(--text-primary)' }}>{statusMsg}</span>}
        </div>
      </form>
    </div>
  );
};

export default Settings;
