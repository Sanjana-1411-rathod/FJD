import React from 'react';
import { ShieldCheck } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer glass-panel">
      <div className="footer-container">
        <div className="footer-brand">
          <ShieldCheck className="logo-icon" size={24} />
          <span className="logo-text">AuthentiJob</span>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Contact Support</a>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} AuthentiJob. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
