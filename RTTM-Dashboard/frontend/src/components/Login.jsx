import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (resp.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', margin: 0, padding: 0, backgroundColor: 'var(--bg-primary)' }}>
      <div className="card log-card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>RTTM Secure Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {error && <div style={{ color: 'var(--status-critical)', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', boxSizing: 'border-box'
              }}
              required 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', boxSizing: 'border-box'
              }}
              required 
            />
          </div>
          <button 
            type="submit" 
            style={{
              padding: '12px', marginTop: '10px',
              backgroundColor: 'var(--status-secure)', color: '#000',
              border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '1.1rem'
            }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
