import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [keywords, setKeywords] = useState('');
  const [targetUrls, setTargetUrls] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchExistingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [kwResp, urlResp] = await Promise.all([
        fetch('http://localhost:5000/api/keywords', { headers }),
        fetch('http://localhost:5000/api/target_urls', { headers })
      ]);

      if (kwResp.ok && urlResp.ok) {
        const kwData = await kwResp.json();
        const urlData = await urlResp.json();
        
        setKeywords(kwData.map(k => k.keyword).join(', '));
        setTargetUrls(urlData.map(u => u.url).join('\n'));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchExistingData();
  }, []);

  const handleSave = async () => {
    setStatusMsg('Saving...');
    const token = localStorage.getItem('token');
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    try {
      const kwList = keywords.split(',').map(s => s.trim()).filter(s => s);
      const urlList = targetUrls.split('\n').map(s => s.trim()).filter(s => s);

      // Append new items to our SQLite tables.
      const promises = [];
      for (const kw of kwList) {
        promises.push(fetch('http://localhost:5000/api/keywords', { method: 'POST', headers, body: JSON.stringify({ keyword: kw }) }));
      }
      for (const url of urlList) {
        promises.push(fetch('http://localhost:5000/api/target_urls', { method: 'POST', headers, body: JSON.stringify({ url: url }) }));
      }

      await Promise.all(promises);
      setStatusMsg('Configuration saved successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      fetchExistingData(); // Refresh our data
    } catch (err) {
      setStatusMsg('Failed to save configuration.');
    }
  };

  return (
    <div className="card log-card" style={{ maxWidth: '600px' }}>
      <h3 style={{ marginBottom: '24px' }}>System Configuration</h3>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Keywords to Monitor (comma separated)</label>
          <textarea 
            rows="3" 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., project voldemort, internal confidential, API_KEY"
            style={{
              width: '100%', padding: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical'
            }}
          />
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
            Save Configuration
          </button>
          {statusMsg && <span style={{ color: 'var(--text-primary)' }}>{statusMsg}</span>}
        </div>
      </form>
    </div>
  );
};

export default Settings;
