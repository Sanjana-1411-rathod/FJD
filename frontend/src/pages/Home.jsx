import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, Image as ImageIcon, Map, MessageSquare, ArrowRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  const features = [
    { icon: Search, title: 'Smart Job Analyzer', desc: 'Paste a link or text to detect scams instantly using advanced AI.', path: '/analyzer' },
    { icon: ImageIcon, title: 'Logo Authentication', desc: 'Upload a company logo to check for low-quality or copied images.', path: '/logo-analysis' },
    { icon: Map, title: 'Global Scam Map', desc: 'See real-time trends of where job scams are originating.', path: '/map' },
    { icon: MessageSquare, title: 'AI Assistant', desc: 'Ask questions like "Is this safe?" and get instant guidance.', path: '/analyzer' }
  ];

  return (
    <div className="home-page animate-fade-in">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">
            <ShieldCheck size={16} /> <span>100% Privacy Focused</span>
          </div>
          <h1 className="hero-title">
            Don't get scammed.<br/> <span className="text-gradient">Verify your next job.</span>
          </h1>
          <p className="hero-subtitle">
            AuthentiJob uses advanced AI to analyze job postings, company logos, and offers, protecting you from modern employment scams.
          </p>
          <div className="hero-cta">
            <Link to="/analyzer" className="btn btn-primary btn-lg">
              Start Analyzing <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              View Scam Trends
            </Link>
          </div>
        </div>
        
        {/* Placeholder for a nice 3D element or illustration */}
        <div className="hero-illustration glass-panel">
          <ShieldCheck size={120} className="floating-icon" />
          <div className="glow-orb"></div>
        </div>
      </section>

      <section className="features-section container">
        <h2 className="section-title">How we protect you</h2>
        <div className="features-grid">
          {features.map((f, idx) => (
            <Link to={f.path} key={idx} className="feature-card glass-panel">
              <div className="feature-icon-wrapper">
                <f.icon size={28} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
      
      <section className="privacy-section container glass-panel">
        <div className="privacy-content">
          <h2>Your Data is Safe</h2>
          <p>We believe in absolute privacy. When you upload resumes or job descriptions for analysis, <strong>we do not store them</strong>. All data is processed in memory by our AI and immediately discarded. No PII is ever saved to our database.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
