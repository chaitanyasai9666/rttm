import React, { useState } from 'react';

const EmailSettings = () => {
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    // Input validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('token') || '';
      
      // Make a POST request to our new Flask route
      const response = await fetch('http://localhost:5000/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        // Display the success message returned from the backend
        setMessage(data.message || 'Alert Destination Saved!');
        setEmail(''); // Optional: clear the input or leave it
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save email configuration.');
      }
    } catch (err) {
      console.error('Email Settings Error:', err);
      setError('A network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      borderRadius: '8px', 
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '24px'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Email Alert Configuration</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        Specify the destination email address where real-time threat alerts should be sent.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., security_team@example.com"
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          style={{
            backgroundColor: isSaving ? 'var(--text-secondary)' : 'var(--status-secure)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Success Message */}
      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(0, 255, 136, 0.1)', 
          color: 'var(--status-secure)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          ✓ {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(255, 68, 68, 0.1)', 
          color: 'var(--status-alert)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
};

export default EmailSettings;
