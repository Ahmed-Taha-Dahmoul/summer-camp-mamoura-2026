import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tent, User as UserIcon, LogOut, Settings, HelpCircle, ChevronDown, Menu, X } from 'lucide-react';
import axios from 'axios';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('access_token');
  const isLoggedIn = !!token;

  useEffect(() => {
    if (isLoggedIn) {
      axios.get(`/api/accounts/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUserProfile(res.data);
      }).catch(err => {
        console.error("Error fetching navbar profile:", err);
      });
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar glass">
      <div className="container nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <Tent size={32} color="var(--primary)" />
          <span>Paths of Happiness</span>
        </Link>
        
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} color="var(--text-dark)" /> : <Menu size={24} color="var(--text-dark)" />}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
          <li><Link to="/forum" onClick={closeMobileMenu}>Forum</Link></li>
          {isLoggedIn && <li><Link to="/instantane" onClick={closeMobileMenu}>Instantané</Link></li>}
          <li><Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link></li>
          {isLoggedIn ? (
            <li className="nav-profile-container" ref={dropdownRef}>
              <button 
                className="nav-profile-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {userProfile && userProfile.profile_picture ? (
                  <img 
                    src={userProfile.profile_picture ? userProfile.profile_picture.replace(/^https?:\/\/[^\/]+/, '') : ''} 
                    alt="Profile" 
                    className="nav-avatar-img"
                  />
                ) : (
                  <div className="nav-avatar-placeholder">
                    <UserIcon size={20} />
                  </div>
                )}
                <span className="nav-username">{userProfile?.username}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown glass">
                  <div className="dropdown-header">
                    <p className="font-bold">{userProfile?.first_name || userProfile?.username} {userProfile?.last_name}</p>
                    <p className="text-xs text-muted">@{userProfile?.username}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => { setDropdownOpen(false); closeMobileMenu(); }}>
                    <Settings size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/help" className="dropdown-item" onClick={() => { setDropdownOpen(false); closeMobileMenu(); }}>
                    <HelpCircle size={16} />
                    <span>Help & Support</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item text-red">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li><Link to="/login" className="btn btn-primary" onClick={closeMobileMenu}>Login</Link></li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
