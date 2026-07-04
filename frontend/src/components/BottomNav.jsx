import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Camera, Trophy, LayoutDashboard, User } from 'lucide-react';
import './BottomNav.css';

function BottomNav() {
  const token = localStorage.getItem('access_token');
  const isLoggedIn = !!token;
  const location = useLocation();

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
        <Camera size={22} className="bottom-nav-icon" />
        <span>Instant</span>
      </NavLink>

      <NavLink to="/games" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Trophy size={22} className="bottom-nav-icon" />
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
