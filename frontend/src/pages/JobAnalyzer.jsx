import { saveAnalysis } from '../utils/analysisHistory';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, AlertTriangle, CheckCircle, Search, FileBadge, ShieldCheck, Image as ImageIcon, MapPin, ExternalLink, Briefcase, Navigation, X } from 'lucide-react';
import './JobAnalyzer.css';

// City coords lookup for job location detection
const CITY_COORDS = {
  'bengaluru': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India' },
  'mumbai':    { lat: 19.0760, lng: 72.8777, label: 'Mumbai, India' },
  'delhi':     { lat: 28.6139, lng: 77.2090, label: 'New Delhi, India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad, India' },
  'chennai':   { lat: 13.0827, lng: 80.2707, label: 'Chennai, India' },
  'pune':      { lat: 18.5204, lng: 73.8567, label: 'Pune, India' },
  'kolkata':   { lat: 22.5726, lng: 88.3639, label: 'Kolkata, India' },
  'noida':     { lat: 28.5355, lng: 77.3910, label: 'Noida, India' },
  'gurgaon':   { lat: 28.4595, lng: 77.0266, label: 'Gurgaon, India' },
  'london':    { lat: 51.5074, lng: -0.1278, label: 'London, UK' },
  'new york':  { lat: 40.7128, lng: -74.0060, label: 'New York, USA' },
  'singapore': { lat: 1.3521, lng: 103.8198, label: 'Singapore' },
  'lagos':     { lat: 6.5244, lng: 3.3792,  label: 'Lagos, Nigeria' },
};

const extractJobLocation = (text = '') => {
  const lower = text.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return { lat: 20.5937, lng: 78.9629, label: 'India (approximate)' };
};

// Haversine distance in km
const calcDistance = (c1, c2) => {
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(c1.lat*Math.PI/180)*Math.cos(c2.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

const BACKEND_URL = 'http://localhost:5000';

// ─── Map Modal ───────────────────────────────────────────────────────────────
const MapModal = ({ jobLocation, onClose }) => {
  const [step, setStep] = useState('pick'); // 'pick' | 'map'
  const [userCity, setUserCity] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [distance, setDistance] = useState(null);

  const detectMyLocation = () => {
    setGeoLoading(true); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUserCity('My Current Location');
        setGeoLoading(false);
      },
      () => { setGeoError('Could not detect location. Please type your city.'); setGeoLoading(false); }
    );
  };

  const handleCityInput = val => {
    setUserCity(val);
    const match = CITY_COORDS[val.toLowerCase().trim()];
    if (match) { setUserCoords(match); setGeoError(''); }
    else setUserCoords(null);
  };

  const showMap = () => {
    if (!userCoords) return;
    setDistance(calcDistance(userCoords, jobLocation));
    setStep('map');
  };

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${jobLocation.lng-0.15},${jobLocation.lat-0.1},${jobLocation.lng+0.15},${jobLocation.lat+0.1}&layer=mapnik&marker=${jobLocation.lat},${jobLocation.lng}`;
  const gmapsUrl = userCoords
    ? `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${jobLocation.lat},${jobLocation.lng}`
    : `https://maps.google.com/?q=${jobLocation.lat},${jobLocation.lng}`;

  const commuteHint = distance <= 30
    ? '✅ Very commutable — easy daily travel!'
    : distance <= 200
    ? '🚌 Moderate distance — consider relocation or hybrid options.'
    : '✈️ Far away — check if remote/hybrid work is available.';

  return (
    <div className="map-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="map-modal-container glass-panel">
        <div className="map-modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <MapPin size={20} color="var(--accent-primary)" />
            <h3 style={{ margin:0, fontSize:'1.1rem' }}>Job Location</h3>
            <span className="map-loc-chip">{jobLocation.label}</span>
          </div>
          <button className="map-close-btn" onClick={onClose}><X size={18}/></button>
        </div>

        {step === 'pick' && (
          <div className="map-source-picker">
            <p style={{ color:'var(--text-secondary)', marginBottom:'1rem', fontSize:'0.9rem' }}>
              📍 Where are <strong style={{color:'var(--text-primary)'}}>you</strong> travelling from?
            </p>
            <button className="btn btn-primary" style={{ width:'100%', marginBottom:'0.75rem', gap:'8px' }} onClick={detectMyLocation} disabled={geoLoading}>
              {geoLoading ? '⏳ Detecting...' : <><Navigation size={16}/> Use My Current Location</>}
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'0.5rem 0' }}>
              <div style={{ flex:1, height:'1px', background:'var(--border-color)' }}/>
              <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>or type your city</span>
              <div style={{ flex:1, height:'1px', background:'var(--border-color)' }}/>
            </div>
            <input
              type="text" className="input-field"
              placeholder="e.g. Bengaluru, Mumbai, Delhi, Chennai..."
              value={userCity} onChange={e => handleCityInput(e.target.value)}
              style={{ marginBottom:'0.5rem' }}
            />
            {geoError && <p style={{ color:'var(--warning)', fontSize:'0.82rem', marginBottom:'0.5rem' }}>{geoError}</p>}
            {userCoords && (
              <button className="btn btn-primary" style={{ width:'100%', marginTop:'0.5rem', gap:'8px' }} onClick={showMap}>
                <MapPin size={16}/> Show Route &amp; Distance
              </button>
            )}
          </div>
        )}

        {step === 'map' && (
          <div className="map-view-area">
            {/* Distance card */}
            <div className="map-distance-card">
              <div className="map-route-info">
                <div className="map-route-point">
                  <Navigation size={14} color="var(--accent-primary)"/>
                  <span>{userCity}</span>
                </div>
                <div className="map-route-connector">
                  <div className="map-dot"/><div className="map-dash"/><div className="map-dot"/>
                </div>
                <div className="map-route-point">
                  <MapPin size={14} color="var(--danger)"/>
                  <span>{jobLocation.label}</span>
                </div>
              </div>
              <div className="map-distance-value">
                <span className="dist-num">{distance?.toLocaleString()}</span>
                <span className="dist-unit">km away</span>
              </div>
              <p className="map-commute-hint">{commuteHint}</p>
            </div>

            {/* OSM Map */}
            <div className="map-iframe-wrap">
              <iframe
                title="Job Location Map"
                src={osmUrl}
                style={{ width:'100%', height:'260px', border:'none', borderRadius:'10px' }}
                loading="lazy"
              />
            </div>

            <div className="map-actions">
              <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary" style={{ flex:1, textDecoration:'none', justifyContent:'center', gap:'6px' }}>
                <ExternalLink size={15}/> Open in Google Maps
              </a>
              <button className="btn btn-secondary" style={{ flex:1 }}
                onClick={() => { setStep('pick'); setUserCoords(null); setUserCity(''); }}>
                Change Source
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const JobAnalyzer = () => {
  const isDemoMode = false;
  const [activeTab, setActiveTab] = useState('text');
  const [inputData, setInputData] = useState('');
  const [jobImage, setJobImage] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [detectedJobLocation, setDetectedJobLocation] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => r.ok ? setBackendAvailable(true) : setBackendAvailable(false))
      .catch(() => setBackendAvailable(false));
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      if (activeTab === 'text') setInputData("URGENT HIRING!!! Data Entry Clerk needed immediately. Salary: $150/hour. Work from home. No experience needed. Send $50 registration fee.");
      else if (activeTab === 'link') setInputData("http://suspicious-job-portal.scam/job/urgent-data-entry");
      else if (activeTab === 'resume') setJobDescription("URGENT HIRING!!! Data Entry Clerk. Work from home. Send $50 registration fee.");
    } else {
      setInputData(''); setJobImage(null); setJobDescription(''); setResumeFile(null); setResult(null); setError(null); setDetectedJobLocation(null);
    }
  }, [isDemoMode, activeTab]);

  const getDemoResult = () => {
    if (activeTab === 'resume') return { matchScore: 10, isSafe: false, advice: "This job is a scam. It asks for upfront fees which no legitimate employer ever does." };
    if (activeTab === 'image') return { score: 85, verdict: "Suspicious", riskLevel: "High", explanation: "Unusually high pay for simple tasks — a hallmark of employment scams.", suspiciousPhrases: [] };
    return { score: 95, verdict: "Fake", riskLevel: "High", explanation: "This job promises $150/hr with no experience and demands a $50 fee — classic scam.", suspiciousPhrases: ["URGENT HIRING!!!", "$150/hour", "No experience needed", "Send $50 registration fee"] };
  };

  const dispatchToMap = (res, inputText) => {
    if ((res.verdict === 'Fake' || res.verdict === 'Suspicious' || res.isSafe === false) && (res.score > 40)) {
      const loc = extractJobLocation(inputText);
      window.dispatchEvent(new CustomEvent('newScamDetected', { detail: { ...loc, company: 'Analyzed Posting', riskLevel: res.riskLevel || 'High' } }));
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true); setError(null); setResult(null); setDetectedJobLocation(null);
    try {
      if (isDemoMode || !backendAvailable) {
        await new Promise(r => setTimeout(r, 1500));
        const demoRes = getDemoResult();
        setResult(demoRes);
        if (!isDemoMode && !backendAvailable) setError('Backend not running. Showing demo result.');
        dispatchToMap(demoRes, inputData + jobDescription);
        setDetectedJobLocation(extractJobLocation(inputData + jobDescription));
        return;
      }
      let res, data;
      if (activeTab === 'resume') {
        const fd = new FormData(); fd.append('resume', resumeFile); fd.append('jobDescription', jobDescription);
        res = await fetch(`${BACKEND_URL}/api/analyze/resume`, { method: 'POST', body: fd });
      } else if (activeTab === 'image') {
        const fd = new FormData(); fd.append('image', jobImage);
        res = await fetch(`${BACKEND_URL}/api/analyze/job`, { method: 'POST', body: fd });
      } else {
        const payload = activeTab === 'text' ? { text: inputData } : { link: inputData };
        res = await fetch(`${BACKEND_URL}/api/analyze/job`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Analysis failed.');
      } else {
        setResult(data);
        saveAnalysis(data, activeTab, inputData || jobDescription);
        dispatchToMap(data, inputData + jobDescription);
        setDetectedJobLocation(extractJobLocation(inputData + jobDescription + (data.explanation || '')));
      }
    } catch (err) {
      setError('Cannot reach the backend server. Make sure it is running on port 5000.');
    } finally { setIsAnalyzing(false); }
  };

  const canAnalyze = () => {
    if (isAnalyzing) return false;
    if (activeTab === 'text') return !!inputData.trim();
    if (activeTab === 'link') return !!inputData.trim();
    if (activeTab === 'image') return !!(jobImage || isDemoMode);
    if (activeTab === 'resume') return !!(jobDescription.trim() && (resumeFile || isDemoMode));
    if (activeTab === 'portal') return !!inputData.trim();
    return false;
  };

  const renderHighlightedText = () => {
    if (!result?.suspiciousPhrases?.length || activeTab !== 'text') return inputData;
    let highlighted = inputData;
    result.suspiciousPhrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="highlight-suspicious">$1</span>');
    });
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="analyzer-page container animate-fade-in">
      <header className="page-header">
        <h1>Smart Job Analyzer</h1>
        <p>Paste a job description, link, or image to instantly detect scams using AI.</p>
        {backendAvailable === false && !isDemoMode && (
          <div style={{ marginTop:'0.75rem', padding:'0.6rem 1rem', background:'rgba(255,184,0,0.1)', border:'1px solid rgba(255,184,0,0.3)', borderRadius:'8px', fontSize:'0.85rem', color:'var(--warning)', display:'flex', alignItems:'center', gap:'8px' }}>
            <AlertTriangle size={16}/>
            Backend offline — toggle <strong>Demo Mode</strong> in the navbar to test.
          </div>
        )}
      </header>

      <div className="analyzer-grid">
        {/* Input panel */}
        <div className="input-section glass-panel">
          <div className="tabs">
            {[
              { id:'text',   icon:FileText,  label:'Text' },
              { id:'link',   icon:LinkIcon,  label:'Link' },
              { id:'image',  icon:ImageIcon, label:'Image' },
              { id:'resume', icon:FileBadge, label:'Resume Match' },
              { id:'portal', icon:Briefcase, label:'🔗 LinkedIn / Naukri' },
            ].map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab===tab.id?'active':''}`} onClick={()=>setActiveTab(tab.id)}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>
          <div className="input-area">
            {activeTab==='text' && <textarea className="input-field textarea" placeholder="Paste the full job description here..." value={inputData} onChange={e=>setInputData(e.target.value)}/>}
            {activeTab==='link' && <input type="text" className="input-field" placeholder="https://example.com/job/posting" value={inputData} onChange={e=>setInputData(e.target.value)}/>}
            {activeTab==='image' && (
              <div className="upload-zone">
                <Upload size={42} style={{opacity:0.5}}/>
                <p style={{fontSize:'1.1rem',marginBottom:'0.5rem'}}>Upload Job Screenshot</p>
                <p className="text-secondary" style={{fontSize:'0.85rem',marginBottom:'1.5rem'}}>We scan the text inside the image to detect scams.</p>
                <input type="file" accept="image/*" onChange={e=>setJobImage(e.target.files[0])}/>
                {jobImage && <p style={{color:'var(--success)',marginTop:'0.75rem',fontSize:'0.85rem'}}>✓ {jobImage.name}</p>}
              </div>
            )}
            {activeTab==='portal' && (
              <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
                <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',margin:0}}>Paste the job portal URL — LinkedIn, Naukri, Indeed, and Internshala are all supported.</p>
                <input type="url" className="input-field" placeholder="https://www.linkedin.com/jobs/view/..." value={inputData} onChange={e=>setInputData(e.target.value)}/>
                <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
                  {[{name:'LinkedIn',url:'https://www.linkedin.com/jobs/',color:'#0a66c2',emoji:'💼'},{name:'Naukri',url:'https://www.naukri.com/',color:'#ff7555',emoji:'🏢'},{name:'Indeed',url:'https://in.indeed.com/',color:'#2164f3',emoji:'🔍'},{name:'Internshala',url:'https://internshala.com/jobs/',color:'#009aff',emoji:'🎓'}].map(p=>(
                    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'20px',background:p.color+'22',border:'1px solid '+p.color+'44',color:p.color,fontSize:'0.8rem',fontWeight:600,textDecoration:'none'}}>
                      {p.emoji} {p.name} <ExternalLink size={12}/>
                    </a>
                  ))}
                </div>
                <div style={{padding:'10px 14px',background:'rgba(0,240,255,0.05)',borderRadius:'8px',border:'1px solid rgba(0,240,255,0.15)',fontSize:'0.8rem',color:'var(--text-secondary)'}}>
                  💡 <strong style={{color:'var(--text-primary)'}}>Tip:</strong> Open the job page → copy the URL → paste it here → click Analyze!
                </div>
              </div>
            )}
            {activeTab==='resume' && (
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',height:'100%'}}>
                <textarea className="input-field" style={{minHeight:'140px'}} placeholder="Paste job description here..." value={jobDescription} onChange={e=>setJobDescription(e.target.value)}/>
                <div className="upload-zone" style={{padding:'1.25rem'}}>
                  <Upload size={28} style={{opacity:0.5,marginBottom:'0.5rem'}}/>
                  <p style={{marginBottom:'0.5rem'}}>Upload Resume (PDF or TXT)</p>
                  <input type="file" accept=".pdf,.txt" onChange={e=>setResumeFile(e.target.files[0])}/>
                  {resumeFile && <p style={{color:'var(--success)',marginTop:'0.5rem',fontSize:'0.85rem'}}>✓ {resumeFile.name}</p>}
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={handleAnalyze} disabled={!canAnalyze()}>
            {isAnalyzing ? <><div className="spinner"/> Analyzing...</> : <><Search size={18}/> Analyze Job</>}
          </button>
        </div>

        {/* Results panel */}
        <div className="result-section">
          {!result && !isAnalyzing && !error && (
            <div className="empty-state glass-panel">
              <ShieldCheck size={48} style={{opacity:0.3}}/>
              <h3>Awaiting Analysis</h3>
              <p>Enter job details on the left to see the results here.</p>
            </div>
          )}
          {error && !isAnalyzing && (
            <div className="error-state glass-panel" style={{borderColor:'var(--warning)',background:'rgba(255,184,0,0.05)'}}>
              <AlertTriangle size={40} color="var(--warning)" style={{marginBottom:'1rem'}}/>
              <h3 style={{color:'var(--warning)'}}>Notice</h3>
              <p style={{color:'var(--text-secondary)'}}>{error}</p>
            </div>
          )}
          {isAnalyzing && (
            <div className="analyzing-state glass-panel">
              <div className="scan-line"/>
              <Search size={48} color="var(--accent-primary)" style={{marginBottom:'1rem'}}/>
              <h3 style={{color:'var(--accent-primary)',textTransform:'uppercase',letterSpacing:'2px'}}>AI Pattern Recognition Active</h3>
              <p style={{fontFamily:'monospace',color:'var(--accent-hover)'}}>Scanning neural pathways...</p>
              <p style={{fontFamily:'monospace',color:'var(--text-secondary)',fontSize:'0.8rem',marginTop:'0.5rem'}}>Checking databases, URL reputation, NLP models...</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="results-card glass-panel animate-fade-in">
              {activeTab === 'resume' ? (
                <>
                  <div className="result-header">
                    <div className="score-ring" style={{'--score':`${result.matchScore}%`,'--color':result.matchScore>70?'var(--success)':'var(--warning)'}}>
                      <span className="score-value">{result.matchScore}%</span>
                      <span className="score-label">Match</span>
                    </div>
                    <div className="verdict-info">
                      <h2 style={{color:result.isSafe?'var(--success)':'var(--danger)',display:'flex',alignItems:'center',gap:'8px'}}>
                        {result.isSafe?<CheckCircle size={24}/>:<AlertTriangle size={24}/>}
                        {result.isSafe?'Job Appears Safe':'Suspicious Job'}
                      </h2>
                    </div>
                  </div>
                  <div className="explanation-box"><h4>AI Career Advice</h4><p>{result.advice}</p></div>
                  {detectedJobLocation && (
                    <button className="btn-map-location" onClick={()=>setShowMapModal(true)}>
                      <MapPin size={16}/>
                      <span>View Job Location &amp; Distance</span>
                      <span className="map-loc-chip">{detectedJobLocation.label}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="result-header">
                    <div className="score-ring" style={{'--score':`${result.score||0}%`,'--color':result.score>70?'var(--danger)':result.score>30?'var(--warning)':'var(--success)'}}>
                      <span className="score-value">{result.score||0}</span>
                      <span className="score-label">Risk Score</span>
                    </div>
                    <div className="verdict-info">
                      <h2 style={{color:result.verdict==='Fake'?'var(--danger)':result.verdict==='Suspicious'?'var(--warning)':'var(--success)',display:'flex',alignItems:'center',gap:'8px'}}>
                        {result.verdict==='Fake'||result.verdict==='Suspicious'?<AlertTriangle size={24}/>:<CheckCircle size={24}/>}
                        Verdict: {result.verdict||'Unknown'}
                      </h2>
                      {result.riskLevel && <span className={`risk-badge risk-${result.riskLevel.toLowerCase()}`}>{result.riskLevel} Risk</span>}
                    </div>
                  </div>
                  <div className="explanation-box"><h4>AI Analysis</h4><p>{result.explanation||'No explanation provided.'}</p></div>
                  {activeTab==='text'&&result.suspiciousPhrases?.length>0&&(
                    <div className="smart-highlighter">
                      <h4>🔍 Smart Highlighter — Suspicious Phrases</h4>
                      <div className="highlighted-text">{renderHighlightedText()}</div>
                    </div>
                  )}

                  {/* ── 📍 MAP LOCATION BUTTON ── */}
                  {detectedJobLocation && (
                    <button className="btn-map-location" onClick={()=>setShowMapModal(true)}>
                      <MapPin size={16}/>
                      <span>Check Job Location &amp; Distance from You</span>
                      <span className="map-loc-chip">{detectedJobLocation.label}</span>
                    </button>
                  )}

                  {(result.verdict==='Fake'||result.verdict==='Suspicious')&&(
                    <div className="map-notice" style={{display:'flex',alignItems:'center',gap:'8px',padding:'0.6rem 1rem',background:'rgba(255,42,85,0.1)',borderRadius:'8px',fontSize:'0.82rem',color:'var(--danger)'}}>
                      <MapPin size={14}/>
                      This scam has been pinned on the <a href="/map" style={{color:'var(--accent-primary)'}}>Scam Map</a>.
                    </div>
                  )}
                  <div className="report-action">
                    <p>Think this is definitely a scam?</p>
                    <button className="btn btn-secondary" style={{color:'var(--danger)',borderColor:'var(--danger)'}}>Report to Database</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showMapModal && detectedJobLocation && (
        <MapModal jobLocation={detectedJobLocation} onClose={()=>setShowMapModal(false)}/>
      )}
    </div>
  );
};

export default JobAnalyzer;
