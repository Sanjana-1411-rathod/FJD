import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, Map as MapIcon, Image as ImageIcon, Home, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Analyzer', path: '/analyzer', icon: ShieldCheck },
    { name: 'Logo Check', path: '/logo-analysis', icon: ImageIcon },
    { name: 'Trends', path: '/dashboard', icon: Activity },
    { name: 'Scam Map', path: '/map', icon: MapIcon },
  ];

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        {/* Logo on the LEFT */}
        <Link to="/" className="navbar-logo">
          <ShieldCheck className="logo-icon" size={28} />
          <span className="logo-text">AuthentiJob</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-name"><User size={16} /> {user.name}</span>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <LogIn size={16} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
