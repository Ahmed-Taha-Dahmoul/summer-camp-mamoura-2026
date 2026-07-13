import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, Camera, Trophy, LayoutDashboard, User } from 'lucide-react';
import './BottomNav.css';

function BottomNav() {
  const token = localStorage.getItem('access_token');
  const isLoggedIn = !!token;
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      axios.get('/api/instantane/unread_count/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUnreadCount(res.data.unread_count))
      .catch(err => console.error('Failed to fetch unread instants:', err));
    }
  }, [isLoggedIn, token, location.pathname]);

  if (!isLoggedIn) {
    return null;
  }

  // Hide BottomNav on some pages if needed (like login/register, or full-screen camera pages)
  if (location.pathname === '/login' || location.pathname === '/instantane') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={22} className="bottom-nav-icon" />
        <span>Home</span>
      </NavLink>
      
      <NavLink to="/instantane" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <Camera size={22} className="bottom-nav-icon" />
          {unreadCount > 0 && (
            <span className="instantane-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
        <span>Instant</span>
      </NavLink>

      <NavLink to="/games" className={({ isActive }) => `bottom-nav-item bottom-nav-fab ${isActive ? 'active' : ''}`}>
        <div className="fab-circle">
          <Trophy size={26} className="bottom-nav-icon" />
        </div>
        <span>Games</span>
      </NavLink>

      <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} className="bottom-nav-icon" />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} className="bottom-nav-icon" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
