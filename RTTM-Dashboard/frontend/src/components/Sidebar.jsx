import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
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
              <span>Alerts</span>
              <span className="badge badge-alert">3</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>v1.0.0 Alpha</p>
      </div>
    </div>
  );
};

export default Sidebar;
