import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-status">
        {/* Intentionally left blank as requested to remove the Backend Active badge */}
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
