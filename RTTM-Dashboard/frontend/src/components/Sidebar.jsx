import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>RTTM System</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/keywords" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Keywords
            </NavLink>
          </li>
          <li>
            <NavLink to="/alerts" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Alerts
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button 
          onClick={handleLogout} 
          style={{
            padding: '10px', 
            backgroundColor: 'rgba(255, 60, 60, 0.1)', 
            color: '#ff4d4d', 
            border: '1px solid rgba(255, 60, 60, 0.4)', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%',
            transition: 'background-color 0.2s',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 60, 60, 0.2)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 60, 60, 0.1)'}
        >
          Logout
        </button>
        <p>v1.0.0 Alpha</p>
      </div>
    </div>
  );
};

export default Sidebar;
