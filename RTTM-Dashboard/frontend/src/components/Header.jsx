import React, { useEffect, useState } from 'react';
import './Header.css';

const Header = () => {
  const [apiStatus, setApiStatus] = useState('Connecting...');
  
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus(data.status);
      })
      .catch(err => {
        setApiStatus('Offline');
      });
  }, []);

  return (
    <header className="header">
      <div className="header-status">
        <div className={`status-indicator ${apiStatus === 'Offline' ? 'offline' : 'online'}`}></div>
        <span>{apiStatus}</span>
      </div>
      
      <div className="header-profile">
        <div className="profile-details">
          <span className="profile-name">Admin User</span>
          <span className="profile-role">Security Operator</span>
        </div>
        <div className="profile-avatar">
          AD
        </div>
      </div>
    </header>
  );
};

export default Header;
