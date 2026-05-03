import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, EyeOff } from 'lucide-react';
import './LiveTicker.css';

const mockReports = [
  { id: 1, type: 'Data Entry Scam', location: 'New York, US', amount: '$150', icon: AlertTriangle, color: 'var(--danger)' },
  { id: 2, type: 'Reshipping Scam', location: 'London, UK', amount: 'N/A', icon: Shield, color: 'var(--warning)' },
  { id: 3, type: 'Fake Check', location: 'Toronto, CA', amount: '$2000', icon: AlertTriangle, color: 'var(--danger)' },
  { id: 4, type: 'Pyramid Scheme', location: 'Sydney, AU', amount: '$50 fee', icon: EyeOff, color: 'var(--accent-primary)' },
  { id: 5, type: 'Phishing Link', location: 'Mumbai, IN', amount: 'Identity', icon: Shield, color: 'var(--danger)' },
];

const LiveTicker = () => {
  return (
    <div className="ticker-container">
      <div className="ticker-label">LIVE FEED</div>
      <div className="ticker-scroll">
        <div className="ticker-content">
          {[...mockReports, ...mockReports, ...mockReports].map((report, index) => {
             const Icon = report.icon;
             return (
               <div key={`${report.id}-${index}`} className="ticker-item">
                 <Icon size={14} color={report.color} />
                 <span className="ticker-text">
                   <span style={{color: report.color, fontWeight: 'bold'}}>{report.type}</span> intercepted targeting users in {report.location}
                   {report.amount !== 'N/A' && ` (Attempted loss: ${report.amount})`}
                 </span>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;
