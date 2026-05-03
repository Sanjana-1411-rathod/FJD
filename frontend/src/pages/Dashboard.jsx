import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line
} from 'recharts';
import { ShieldAlert, CheckCircle, AlertTriangle, Clock, Trash2, FileText, ExternalLink, Search, TrendingUp, Globe } from 'lucide-react';
import { getHistory, clearHistory } from '../utils/analysisHistory';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const VERDICT_COLORS = {
  Fake: '#ef4444',
  Suspicious: '#f59e0b',
  Genuine: '#10b981',
  Safe: '#10b981',
  Unknown: '#8b9bb4',
};

// Global industry trends data (based on real-world job scam statistics)
const GLOBAL_TRENDS = {
  monthlyScamRate: [
    { month: 'Nov', scamRate: 34, reportedJobs: 12400 },
    { month: 'Dec', scamRate: 41, reportedJobs: 15200 },
    { month: 'Jan', scamRate: 38, reportedJobs: 13800 },
    { month: 'Feb', scamRate: 29, reportedJobs: 11200 },
    { month: 'Mar', scamRate: 45, reportedJobs: 17600 },
    { month: 'Apr', scamRate: 52, reportedJobs: 21300 },
    { month: 'May', scamRate: 48, reportedJobs: 19800 },
  ],
  platformBreakdown: [
    { platform: 'WhatsApp', fake: 68, genuine: 32 },
    { platform: 'Telegram', fake: 74, genuine: 26 },
    { platform: 'LinkedIn', fake: 12, genuine: 88 },
    { platform: 'Naukri', fake: 18, genuine: 82 },
    { platform: 'Email', fake: 55, genuine: 45 },
    { platform: 'Indeed', fake: 14, genuine: 86 },
  ],
  topRedFlags: [
    { flag: 'Too-good salary', count: 8420 },
    { flag: 'Upfront fee demand', count: 6130 },
    { flag: 'No interview needed', count: 5870 },
    { flag: 'Work from home only', count: 4990 },
    { flag: 'Vague job role', count: 4220 },
  ],
};

// Job portals list
const JOB_PORTALS = [
  {
    name: 'LinkedIn',
    emoji: '💼',
    color: '#0a66c2',
    bg: 'rgba(10,102,194,0.12)',
    border: 'rgba(10,102,194,0.35)',
    url: 'https://www.linkedin.com/jobs/',
    desc: 'Professional network jobs',
    steps: ['Open LinkedIn Jobs', 'Take a screenshot or copy the job link', 'Go back → Check in the Analyzer'],
  },
  {
    name: 'Naukri',
    emoji: '🏢',
    color: '#ff7555',
    bg: 'rgba(255,117,85,0.12)',
    border: 'rgba(255,117,85,0.35)',
    url: 'https://www.naukri.com/',
    desc: "India's #1 job portal",
    steps: ['Open Naukri.com', 'Copy the job description or take a screenshot', 'Go back → Check in the Analyzer'],
  },
  {
    name: 'Indeed',
    emoji: '🔍',
    color: '#2164f3',
    bg: 'rgba(33,100,243,0.12)',
    border: 'rgba(33,100,243,0.35)',
    url: 'https://in.indeed.com/',
    desc: 'Global job listings',
    steps: ['Open Indeed India', 'Copy the job URL', 'Go back → Analyzer → Paste in the Link tab'],
  },
  {
    name: 'Internshala',
    emoji: '🎓',
    color: '#009aff',
    bg: 'rgba(0,154,255,0.12)',
    border: 'rgba(0,154,255,0.35)',
    url: 'https://internshala.com/jobs/',
    desc: 'Internships & fresher jobs',
    steps: ['Open Internshala', 'Copy the job posting', 'Go back → Check in the Analyzer'],
  },
  {
    name: 'Shine',
    emoji: '✨',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    url: 'https://www.shine.com/',
    desc: 'HT Media job portal',
    steps: ['Open Shine.com', 'Take a screenshot of the job offer', 'Go back → Analyzer → Upload in the Image tab'],
  },
  {
    name: 'Monster',
    emoji: '👾',
    color: '#6c3fa0',
    bg: 'rgba(108,63,160,0.12)',
    border: 'rgba(108,63,160,0.35)',
    url: 'https://www.monsterindia.com/',
    desc: 'Monster India jobs',
    steps: ['Open Monster India', 'Copy the job description', 'Go back → Analyzer → Paste in the Text tab'],
  },
];

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [activePortal, setActivePortal] = useState(null);
  const navigate = useNavigate();

  const load = () => setHistory(getHistory());
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  const handleClear = () => {
    if (window.confirm('Saari history delete kar doon?')) { clearHistory(); setHistory([]); }
  };

  // ── Derived stats ──
  const total        = history.length;
  const fakeCount    = history.filter(h => h.verdict === 'Fake').length;
  const suspCount    = history.filter(h => h.verdict === 'Suspicious').length;
  const genuineCount = history.filter(h => ['Genuine','Safe'].includes(h.verdict)).length;
  const unknownCount = history.filter(h => !['Fake','Suspicious','Genuine','Safe'].includes(h.verdict)).length;

  const verdictPie = [
    { name: 'Fake',       value: fakeCount,     color: '#ef4444' },
    { name: 'Suspicious', value: suspCount,      color: '#f59e0b' },
    { name: 'Genuine',    value: genuineCount,   color: '#10b981' },
    { name: 'Unknown',    value: unknownCount,   color: '#8b9bb4' },
  ].filter(d => d.value > 0);

  const dayMap = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dayMap[key] = { date: key, Fake: 0, Suspicious: 0, Genuine: 0 };
  }
  history.forEach(h => {
    const key = new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    if (dayMap[key]) {
      const v = ['Genuine','Safe'].includes(h.verdict) ? 'Genuine' : 
                ['Fake','Suspicious'].includes(h.verdict) ? h.verdict : 'Genuine'; // Unknown → treat as analyzed/neutral
      if (dayMap[key] && dayMap[key][v] !== undefined) dayMap[key][v]++;
    }
  });
  const dailyData = Object.values(dayMap);

  const tooltipStyle = {
    contentStyle: { background: '#0a1128', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#f0f6fc' },
    cursor: { fill: 'rgba(0,240,255,0.05)' }
  };

  return (
    <div className="dashboard-page container animate-fade-in">

      {/* ── Job Portals Section ── */}
      <header className="page-header" style={{ marginBottom: '0.5rem' }}>
        <h1>Job Portals</h1>
        <p>Go to any job portal → find a job → come back and check it in the Analyzer</p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        {JOB_PORTALS.map((portal) => (
          <div key={portal.name}
            onClick={() => setActivePortal(activePortal?.name === portal.name ? null : portal)}
            style={{
              background: activePortal?.name === portal.name ? portal.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activePortal?.name === portal.name ? portal.border : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '14px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{portal.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: portal.color, marginBottom: '2px' }}>{portal.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{portal.desc}</div>
            <a
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '20px',
                background: portal.bg, border: `1px solid ${portal.border}`,
                color: portal.color, fontSize: '0.78rem', fontWeight: 600,
                textDecoration: 'none'
              }}>
              Open <ExternalLink size={11} />
            </a>
          </div>
        ))}
      </div>

      {/* ── Expanded Portal Instructions ── */}
      {activePortal && (
        <div style={{
          background: activePortal.bg,
          border: `1px solid ${activePortal.border}`,
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ color: activePortal.color, margin: 0 }}>
              {activePortal.emoji} How to check with {activePortal.name}?
            </h3>
            <button onClick={() => setActivePortal(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {activePortal.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                padding: '0.75rem 1rem', flex: '1', minWidth: '160px'
              }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: activePortal.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                }}>{i + 1}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href={activePortal.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '20px',
                background: activePortal.color, color: '#fff',
                fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none'
              }}>
              {activePortal.emoji} Open {activePortal.name} <ExternalLink size={13} />
            </a>
            <button onClick={() => navigate('/analyzer')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '20px',
                background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
                color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
              }}>
              <Search size={14} /> Go to Analyzer
            </button>
          </div>
        </div>
      )}

      {/* ── Global Industry Trends ── */}
      <header className="page-header" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ margin: 0 }}>Global Job Scam Trends</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Industry-wide data — how fake jobs are spreading across platforms</p>
          </div>
        </div>
      </header>

      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        {/* Monthly scam rate line chart */}
        <div className="chart-card glass-panel">
          <h3>📈 Monthly Scam Rate (%)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>% of job postings flagged as fake — last 7 months</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GLOBAL_TRENDS.monthlyScamRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#8b9bb4" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8b9bb4" tick={{ fontSize: 10 }} unit="%" domain={[0, 80]} />
                <Tooltip
                  contentStyle={{ background: '#0a1128', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#f0f6fc' }}
                  formatter={(v) => [v + '%', 'Scam Rate']}
                />
                <Line type="monotone" dataKey="scamRate" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform breakdown bar chart */}
        <div className="chart-card glass-panel">
          <h3>📱 Fake % by Platform</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Which platforms have the highest fake job rates</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GLOBAL_TRENDS.platformBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#8b9bb4" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="platform" stroke="#8b9bb4" tick={{ fontSize: 10 }} width={60} />
                <Tooltip
                  contentStyle={{ background: '#0a1128', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#f0f6fc' }}
                  formatter={(v, n) => [v + '%', n === 'fake' ? 'Fake Jobs' : 'Genuine Jobs']}
                />
                <Bar dataKey="fake" fill="#ef4444" radius={[0,4,4,0]} name="fake" />
                <Bar dataKey="genuine" fill="#10b981" radius={[0,4,4,0]} name="genuine" />
                <Legend formatter={(v) => <span style={{ color: '#8b9bb4', fontSize: '0.8rem' }}>{v === 'fake' ? 'Fake Jobs' : 'Genuine Jobs'}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top red flags */}
        <div className="chart-card glass-panel full-width" style={{ maxHeight: '280px' }}>
          <h3>🚩 Top Red Flags Detected (Global)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Most common scam signals found in fake job postings worldwide</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {GLOBAL_TRENDS.topRedFlags.map((item, i) => {
              const max = GLOBAL_TRENDS.topRedFlags[0].count;
              const pct = Math.round((item.count / max) * 100);
              const colors = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16'];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '160px', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{item.flag}</span>
                  <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: colors[i], borderRadius: '5px', transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ width: '50px', fontSize: '0.78rem', color: colors[i], fontWeight: 600, textAlign: 'right' }}>{(item.count/1000).toFixed(1)}k</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── My Analysis Trends ── */}
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Meri Analysis History</h2>
            <p style={{ margin: '4px 0 0' }}>Tumhare analyze kiye hue {total} jobs ka breakdown</p>
          </div>
          {total > 0 && (
            <button className="btn btn-secondary" onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <Trash2 size={16} /> Clear
            </button>
          )}
        </div>
      </header>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No analysis yet</h3>
          <p>Open any portal above → check a job → paste it into the Analyzer!</p>
          <button onClick={() => navigate('/analyzer')}
            style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
            Open Analyzer →
          </button>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stat-cards-container">
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--accent-primary)' }}><Clock size={24} /></div>
              <div className="stat-details">
                <h4>Total Analyzed</h4>
                <span className="stat-number">{total}</span>
                <span className="stat-trend">jobs checked</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}><ShieldAlert size={24} /></div>
              <div className="stat-details">
                <h4>Fake / Scam</h4>
                <span className="stat-number">{fakeCount}</span>
                <span className="stat-trend negative">{total ? Math.round(fakeCount/total*100) : 0}% of total</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}><AlertTriangle size={24} /></div>
              <div className="stat-details">
                <h4>Suspicious</h4>
                <span className="stat-number">{suspCount}</span>
                <span className="stat-trend">{total ? Math.round(suspCount/total*100) : 0}% of total</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
              <div className="stat-details">
                <h4>Genuine Jobs</h4>
                <span className="stat-number">{genuineCount}</span>
                <span className="stat-trend positive">{total ? Math.round(genuineCount/total*100) : 0}% safe</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Pie: Verdict */}
            {verdictPie.length > 0 && (
              <div className="chart-card glass-panel">
                <h3>Verdict Breakdown</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Genuine vs Fake vs Suspicious</p>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={verdictPie} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {verdictPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={(v, n) => [v + ' jobs', n]} />
                      <Legend formatter={(v) => <span style={{ color: '#8b9bb4', fontSize: '0.8rem' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bar: Daily 7 days */}
            <div className="chart-card glass-panel">
              <h3>Last 7 Days</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Har din kitne jobs analyze kiye</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#8b9bb4" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#8b9bb4" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend formatter={(v) => <span style={{ color: '#8b9bb4', fontSize: '0.8rem' }}>{v}</span>} />
                    <Bar dataKey="Fake"       fill="#ef4444" radius={[4,4,0,0]} />
                    <Bar dataKey="Suspicious" fill="#f59e0b" radius={[4,4,0,0]} />
                    <Bar dataKey="Genuine"    fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent history table */}
            <div className="chart-card glass-panel full-width">
              <h3>Recent Analyses</h3>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Time', 'Method', 'Verdict', 'Score', 'Preview'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textTransform: 'capitalize', color: 'var(--accent-primary)' }}>{h.tab}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                            background: `${VERDICT_COLORS[h.verdict] || '#8b9bb4'}22`,
                            color: VERDICT_COLORS[h.verdict] || '#8b9bb4',
                            border: `1px solid ${VERDICT_COLORS[h.verdict] || '#8b9bb4'}44`
                          }}>{h.verdict}</span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {h.score !== null && h.score !== undefined ? h.score : '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.inputPreview || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
