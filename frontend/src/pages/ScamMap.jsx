import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, CheckCircle, MapPin, Navigation, Clock,
  Route, XCircle, Search, Loader2, Info
} from 'lucide-react';
import { getHistory } from '../utils/analysisHistory';
import './ScamMap.css';

// Fix Leaflet default marker icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Known company geo coordinates
const COMPANY_GEO = {
  accenture:    { lat: 28.5355, lng: 77.3910, city: 'Noida, India' },
  google:       { lat: 12.9716, lng: 77.5946, city: 'Bangalore, India' },
  microsoft:    { lat: 12.9352, lng: 77.6245, city: 'Bangalore, India' },
  amazon:       { lat: 12.9352, lng: 77.6245, city: 'Bangalore, India' },
  infosys:      { lat: 12.9716, lng: 77.5946, city: 'Bangalore, India' },
  wipro:        { lat: 12.9279, lng: 77.6271, city: 'Bangalore, India' },
  tcs:          { lat: 19.0760, lng: 72.8777, city: 'Mumbai, India' },
  flipkart:     { lat: 12.9716, lng: 77.5946, city: 'Bangalore, India' },
  hcl:          { lat: 28.6139, lng: 77.2090, city: 'New Delhi, India' },
  deloitte:     { lat: 19.0760, lng: 72.8777, city: 'Mumbai, India' },
  cognizant:    { lat: 12.9716, lng: 77.5946, city: 'Bangalore, India' },
  default:      { lat: 19.0760, lng: 72.8777, city: 'Mumbai, India' },
};

const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const formatDist = (km) => km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;

const estimateDuration = (km) => {
  const h = km / 40;
  if (h < 1) return `~${Math.round(h*60)} min`;
  return `~${Math.floor(h)}h ${Math.round((h-Math.floor(h))*60)}min`;
};

const geocodePlace = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), city: data[0].display_name.split(',').slice(0,2).join(',') };
  } catch(_) {}
  return null;
};

const guessCompanyGeo = async (inputPreview) => {
  const text = (inputPreview || '').toLowerCase();
  for (const [key, val] of Object.entries(COMPANY_GEO)) {
    if (key !== 'default' && text.includes(key)) return { ...val, company: key.charAt(0).toUpperCase()+key.slice(1) };
  }
  // Try geocoding first capitalized word as company
  const match = (inputPreview || '').match(/[A-Z][a-zA-Z]{2,}/);
  if (match) {
    const geo = await geocodePlace(match[0] + ' company office India');
    if (geo) return { ...geo, company: match[0] };
  }
  return { ...COMPANY_GEO.default, company: 'Company' };
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [60,60] });
    else if (points.length === 1) map.setView(points[0], 11);
  }, [JSON.stringify(points)]);
  return null;
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#00f0ff;border:3px solid #fff;box-shadow:0 0 0 5px rgba(0,240,255,0.25),0 0 16px rgba(0,240,255,0.6);"></div>`,
  iconSize: [20,20], iconAnchor: [10,10],
});

const ScamMap = () => {
  const [history] = useState(() => getHistory());
  const [userInput, setUserInput] = useState('');
  const [userGeo, setUserGeo] = useState(null);
  const [userCity, setUserCity] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobGeo, setJobGeo] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [fitPoints, setFitPoints] = useState([[20.5937, 78.9629]]);
  const [liveJobs, setLiveJobs] = useState([]);

  useEffect(() => {
    const h = (e) => {
      const { lat, lng, location, company, riskLevel } = e.detail;
      if (lat && lng) setLiveJobs(p => [...p, { id: Date.now(), lat, lng, location, company, riskLevel }]);
    };
    window.addEventListener('newScamDetected', h);
    return () => window.removeEventListener('newScamDetected', h);
  }, []);

  const getGPS = () => {
    setLocLoading(true); setLocError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await res.json();
        const city = d.address?.city || d.address?.town || d.address?.state || 'Your Location';
        setUserCity(city); setUserInput(city);
      } catch { setUserCity('Your Location'); }
      setUserGeo({ lat, lng }); setLocLoading(false);
    }, () => { setLocError('GPS denied. Type your city below.'); setLocLoading(false); });
  };

  const searchLocation = async () => {
    if (!userInput.trim()) return;
    setLocLoading(true); setLocError('');
    const geo = await geocodePlace(userInput);
    if (geo) { setUserGeo(geo); setUserCity(geo.city || userInput); }
    else setLocError('City not found. Try "Bangalore" or "Mumbai".');
    setLocLoading(false);
  };

  const pickJob = async (entry) => {
    setSelectedJob(entry); setJobGeo(null); setRouteInfo(null); setJobLoading(true);
    const geo = await guessCompanyGeo(entry.inputPreview);
    setJobGeo(geo); setJobLoading(false);
  };

  useEffect(() => {
    if (!userGeo || !jobGeo) { setRouteInfo(null); return; }
    const dist = haversine(userGeo.lat, userGeo.lng, jobGeo.lat, jobGeo.lng);
    setRouteInfo({ distance: dist, duration: estimateDuration(dist) });
    setFitPoints([[userGeo.lat, userGeo.lng], [jobGeo.lat, jobGeo.lng]]);
  }, [userGeo?.lat, userGeo?.lng, jobGeo?.lat, jobGeo?.lng]);

  const isScam = selectedJob && ['Fake','Suspicious'].includes(selectedJob.verdict);
  const isGenuine = selectedJob && ['Genuine','Safe'].includes(selectedJob.verdict);
  const markerColor = isScam ? '#ef4444' : isGenuine ? '#10b981' : '#f59e0b';

  return (
    <div className="map-page container animate-fade-in">
      <header className="page-header">
        <h1>🗺️ Job Safety Map</h1>
        <p>Check how far a job company is from you — and whether it's safe to visit.</p>
      </header>

      <div className="scam-map-layout">

        {/* LEFT PANEL */}
        <div className="map-left-panel">

          {/* Step 1 */}
          <div className="map-panel glass-panel">
            <div className="map-panel-title"><span className="step-badge">1</span><Navigation size={15}/> Your Location</div>
            <button className="btn btn-secondary loc-btn" onClick={getGPS} disabled={locLoading}>
              {locLoading ? <Loader2 size={14} className="spin"/> : <MapPin size={14}/>}
              {locLoading ? 'Detecting...' : 'Use My GPS'}
            </button>
            <div className="or-divider"><span>or type city</span></div>
            <div className="loc-search-row">
              <input className="input-field loc-input" placeholder="e.g. Bangalore, Pune, Delhi..."
                value={userInput} onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchLocation()} />
              <button className="btn btn-primary icon-btn" onClick={searchLocation}><Search size={14}/></button>
            </div>
            {locError && <p className="loc-error"><AlertTriangle size={12}/> {locError}</p>}
            {userGeo && <div className="loc-confirmed"><div className="loc-dot" style={{background:'#00f0ff'}}/><span>📍 {userCity}</span></div>}
          </div>

          {/* Step 2 */}
          <div className="map-panel glass-panel">
            <div className="map-panel-title"><span className="step-badge">2</span><Search size={15}/> Pick a Scanned Job</div>
            {history.length === 0
              ? <p className="no-jobs-msg">No jobs yet. <a href="/analyzer" style={{color:'var(--accent-primary)'}}>Analyze one first →</a></p>
              : <div className="job-list">
                {history.slice(0,8).map(entry => (
                  <div key={entry.id}
                    className={`job-list-item ${selectedJob?.id===entry.id?'selected':''}`}
                    onClick={() => pickJob(entry)}
                    style={{ borderColor: selectedJob?.id===entry.id ? markerColor : undefined }}>
                    <span className="verdict-dot" style={{
                      background: entry.verdict==='Fake'?'#ef4444':entry.verdict==='Suspicious'?'#f59e0b':['Genuine','Safe'].includes(entry.verdict)?'#10b981':'#8b9bb4'
                    }}/>
                    <div className="job-list-info">
                      <span className="job-list-verdict" style={{
                        color: entry.verdict==='Fake'?'#ef4444':['Genuine','Safe'].includes(entry.verdict)?'#10b981':'#f59e0b'
                      }}>{entry.verdict||'Unknown'}</span>
                      <span className="job-list-preview">{(entry.inputPreview||`Job #${entry.id}`).slice(0,48)}…</span>
                      <span className="job-list-time">{new Date(entry.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  </div>
                ))}
              </div>}
          </div>

          {/* Step 3 */}
          {selectedJob && (
            <div className="map-panel glass-panel">
              <div className="map-panel-title"><span className="step-badge">3</span><Route size={15}/> Route &amp; Safety</div>
              {jobLoading && <div style={{display:'flex',gap:'8px',alignItems:'center',color:'var(--text-secondary)',fontSize:'0.82rem'}}><Loader2 size={15} className="spin"/> Finding company...</div>}
              {jobGeo && !jobLoading && (
                <div className="job-geo-info">
                  <div className="geo-row">
                    <MapPin size={13} style={{color:'#00f0ff',flexShrink:0}}/>
                    <span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>Company:</span>
                    <strong style={{fontSize:'0.82rem'}}>{jobGeo.company} — {jobGeo.city}</strong>
                  </div>
                  {routeInfo ? (
                    <>
                      <div className="route-stats">
                        <div className="route-stat-box">
                          <Route size={17} style={{color:'var(--accent-primary)'}}/>
                          <span className="route-stat-val">{formatDist(routeInfo.distance)}</span>
                          <span className="route-stat-label">Distance</span>
                        </div>
                        <div className="route-stat-box">
                          <Clock size={17} style={{color:'var(--accent-primary)'}}/>
                          <span className="route-stat-val">{routeInfo.duration}</span>
                          <span className="route-stat-label">Travel Time</span>
                        </div>
                      </div>
                      <div className={`safety-banner ${isScam?'danger':isGenuine?'safe':'warn'}`}>
                        {isScam ? <XCircle size={18}/> : isGenuine ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                        <div>
                          {isScam
                            ? <><strong>⛔ DO NOT VISIT — {selectedJob.verdict} Job!</strong><p>This is {formatDist(routeInfo.distance)} away ({routeInfo.duration}). High risk of scam. Avoid this location.</p></>
                            : isGenuine
                            ? <><strong>✅ Safe to Visit — Genuine Job</strong><p>Company is {formatDist(routeInfo.distance)} away ({routeInfo.duration}). Appears legitimate — confirm address before going.</p></>
                            : <><strong>⚠️ Suspicious — Verify Before Visiting</strong><p>{formatDist(routeInfo.distance)} away. Research this company thoroughly first.</p></>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>Set your location in Step 1 to see distance &amp; travel time.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {liveJobs.length > 0 && (
            <div className="map-panel glass-panel" style={{borderColor:'rgba(239,68,68,0.4)'}}>
              <div className="map-panel-title" style={{color:'#ef4444'}}><AlertTriangle size={14}/> Live Alerts ({liveJobs.length})</div>
              {liveJobs.map(j => (
                <div key={j.id} style={{fontSize:'0.78rem',color:'var(--text-secondary)',display:'flex',gap:'7px',alignItems:'center',marginBottom:'5px'}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',flexShrink:0,display:'inline-block'}}/>
                  {j.location} — {j.company||'Unknown'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: MAP */}
        <div className="map-right-panel">
          <div className="map-wrapper glass-panel" style={{height:'100%',minHeight:'600px',position:'relative'}}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom style={{width:'100%',height:'100%'}}>
              <TileLayer
                attribution='&copy; OSM &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <FitBounds points={fitPoints}/>
              {userGeo && (
                <Marker position={[userGeo.lat, userGeo.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{minWidth:'150px'}}>
                      <strong style={{color:'#00f0ff'}}>📍 Your Location</strong>
                      <div style={{fontSize:'0.85rem',marginTop:'4px'}}>{userCity}</div>
                    </div>
                  </Popup>
                </Marker>
              )}
              {jobGeo && (
                <CircleMarker center={[jobGeo.lat, jobGeo.lng]}
                  pathOptions={{color:markerColor,fillColor:markerColor,fillOpacity:0.85,weight:3}} radius={18}>
                  <Popup>
                    <div style={{minWidth:'200px'}}>
                      <strong style={{color:markerColor,display:'block',marginBottom:'6px',fontSize:'1rem'}}>
                        {isScam?'⛔':isGenuine?'✅':'⚠️'} {jobGeo.company}
                      </strong>
                      <div style={{fontSize:'0.85rem',marginBottom:'4px'}}>📍 {jobGeo.city}</div>
                      {routeInfo && <>
                        <div style={{fontSize:'0.85rem',marginBottom:'3px'}}>📏 <strong>{formatDist(routeInfo.distance)}</strong> from you</div>
                        <div style={{fontSize:'0.85rem',marginBottom:'8px'}}>⏱️ <strong>{routeInfo.duration}</strong> travel</div>
                      </>}
                      <div style={{padding:'5px 10px',borderRadius:'6px',fontSize:'0.8rem',fontWeight:700,background:markerColor+'22',border:`1px solid ${markerColor}55`,color:markerColor,textAlign:'center'}}>
                        {isScam?'🔴 SCAM — DO NOT VISIT':isGenuine?'🟢 GENUINE — Safe to visit':'🟡 SUSPICIOUS — Verify first'}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}
              {userGeo && jobGeo && (
                <Polyline
                  positions={[[userGeo.lat,userGeo.lng],[jobGeo.lat,jobGeo.lng]]}
                  pathOptions={{color:markerColor,weight:3,opacity:0.7,dashArray:isScam?'10,8':'0'}}
                />
              )}
              {liveJobs.map(j => (
                <CircleMarker key={j.id} center={[j.lat,j.lng]}
                  pathOptions={{color:'#ef4444',fillColor:'#ef4444',fillOpacity:0.8,weight:2}} radius={10}>
                  <Popup>
                    <strong style={{color:'#ef4444'}}>⚡ Live Scam</strong>
                    <div style={{fontSize:'0.85rem',marginTop:'4px'}}>{j.location}</div>
                    <div style={{fontSize:'0.8rem',color:'#aaa'}}>{j.company}</div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            <div className="map-overlay-legend">
              {[['#00f0ff','You'],['#10b981','Genuine'],['#f59e0b','Suspicious'],['#ef4444','Fake/Scam']].map(([c,l])=>(
                <div key={l} className="legend-item">
                  <span style={{width:10,height:10,borderRadius:'50%',background:c,display:'inline-block',flexShrink:0}}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="map-info glass-panel" style={{marginTop:'1.5rem'}}>
        <Info size={15} color="var(--accent-primary)"/>
        <p>Analyze a job in <a href="/analyzer" style={{color:'var(--accent-primary)'}}>Analyzer</a> → come here → pick it from the list → enter your location → see exact distance, travel time &amp; safety verdict on the map.</p>
      </div>
    </div>
  );
};

export default ScamMap;
