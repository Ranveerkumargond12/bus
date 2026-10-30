import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="amazon-footer">
      {/* Back to top button */}
      <a href="#top" onClick={scrollToTop} className="back-to-top">
        Back to top
      </a>

      {/* Main Links Section */}
      <div className="footer-links-container">
        <div className="footer-column">
          <h3>Get to Know Us</h3>
          <ul>
            <li><Link to="/about">About SafarSathi</Link></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/press">Press Releases</Link></li>
            <li><Link to="/science">SafarSathi Science</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Connect with Us</h3>
          <ul>
            <li><a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Partner with Us</h3>
          <ul>
            <li><Link to="/register-operator">Register Bus Operator</Link></li>
            <li><Link to="/register-agent">Become an Agent</Link></li>
            <li><Link to="/advertise">Advertise Your Bus Route</Link></li>
            <li><Link to="/affiliate">Affiliate Program</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Let Us Help You</h3>
          <ul>
            <li><Link to="/my-bookings">Your Account</Link></li>
            <li><Link to="/my-bookings">Cancel Ticket</Link></li>
            <li><Link to="/support">Customer Care & Support</Link></li>
            <li><Link to="/support">100% Booking Protection</Link></li>
          </ul>
        </div>
      </div>

      {/* Divider Line */}
      <div className="footer-divider"></div>

      {/* Logo & Language Row */}
      <div className="footer-middle-branding">
        <div className="logo notranslate">
          <span className="logo-icon">🚌</span> Safar<span className="logo-accent">Sathi</span>
        </div>
        <div className="footer-lang-pill">🌐 India (English)</div>
      </div>

      {/* Bottom Copyright & Legal Links */}
      <div className="footer-bottom">
        <ul className="legal-links">
          <li><a href="#conditions">Conditions of Use & Sale</a></li>
          <li><a href="#privacy">Privacy Notice</a></li>
          <li><a href="#ads">Interest-Based Ads</a></li>
        </ul>
        <p className="copyright-text">© 2026, SafarSathi.com, Inc. or its affiliates</p>
      </div>
    </footer>
  );
}

