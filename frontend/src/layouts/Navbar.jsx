import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo notranslate" onClick={() => setMobileMenuOpen(false)}>
          <span className="logo-icon">🚌</span> Safar<span className="logo-accent">Sathi</span>
        </Link>
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Navigation"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Desktop Navigation */}
      <div className="nav-right nav-right-desktop">
        <ul className="nav-links">
          <div className="lang-selector-wrapper notranslate" style={{ display: 'inline-block', margin: '0 5px' }}>
            <select
              defaultValue="en"
              aria-label="Select Language"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #dcdfe6',
                backgroundColor: '#ffffff',
                color: '#333333',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <option value="en">🌐 English</option>
              <option value="hi">🌐 हिंदी (Hindi)</option>
              <option value="bn">🌐 বাংলা (Bengali)</option>
              <option value="mr">🌐 मराठी (Marathi)</option>
              <option value="te">🌐 తెలుగు (Telugu)</option>
              <option value="ta">🌐 தமிழ் (Tamil)</option>
              <option value="gu">🌐 ગુજરાતી (Gujarati)</option>
              <option value="ur">🌐 اردو (Urdu)</option>
            </select>
          </div>

          <li><Link to="/">Home</Link></li>
          {isAdmin ? (
            <li>
              <Link to="/my-bookings" style={{ color: '#10b981', fontWeight: 'bold' }}>
                🎫 Customer Tickets
              </Link>
            </li>
          ) : (
            <li><Link to="/my-bookings">My Bookings</Link></li>
          )}
          <li><Link to="/offers">Offers</Link></li>
          <li><Link to="/support">Help</Link></li>
        </ul>

        {isAuthenticated ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #dcdfe6',
              color: '#1c2430',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <span
              onClick={() => {
                if (isAdmin) navigate('/admin');
                else if (user?.role === 'conductor') navigate(user?.bus_id ? `/conductor?busId=${user.bus_id}` : '/conductor');
              }}
              style={{
                whiteSpace: 'nowrap',
                cursor: (isAdmin || user?.role === 'conductor') ? 'pointer' : 'default'
              }}
              title={isAdmin ? 'Open Admin Dashboard' : user?.role === 'conductor' ? 'Open Conductor Portal' : displayName}
            >
              👤 {displayName}
            </span>

            <button
              onClick={handleLogout}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Click to Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Link to="/auth" className="btn-login nav-login-btn notranslate">
              Login / Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <ul className="nav-links">
            <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>🏠 Home</Link></li>
            {isAdmin ? (
              <li>
                <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)} style={{ color: '#10b981', fontWeight: 'bold' }}>
                  🎫 Customer Tickets
                </Link>
              </li>
            ) : (
              <li><Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>🎫 My Bookings</Link></li>
            )}
            <li><Link to="/offers" onClick={() => setMobileMenuOpen(false)}>🏷️ Special Offers</Link></li>
            <li><Link to="/support" onClick={() => setMobileMenuOpen(false)}>💬 Help & Support</Link></li>
          </ul>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#1c2430' }}>👤 {displayName}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-login"
                style={{ textAlign: 'center', display: 'block', padding: '10px' }}
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
