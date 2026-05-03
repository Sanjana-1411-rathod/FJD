import React, { useState } from 'react';
import { ShieldCheck, FileText, Download, Edit3, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './JobAnalyzer.css';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: '',
    experience: '',
    skills: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      // For now, simulating the generation, we can hook it to Gemini API later.
      const prompt = `Generate a highly professional, ATS-optimized resume for a ${formData.role}. Experience: ${formData.experience}. Skills: ${formData.skills}.`;
      
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setGeneratedResume(data.reply);
    } catch (err) {
      setError(err.message || 'Failed to generate resume');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="analyzer-page container animate-fade-in">
      <header className="page-header">
        <h1>AI Resume Maker</h1>
        <p>Generate a professional, ATS-optimized resume in seconds.</p>
      </header>

      <div className="analyzer-grid">
        <div className="input-section glass-panel">
          <form onSubmit={handleGenerate} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div>
              <label className="text-secondary" style={{fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block'}}>Target Role</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Frontend Developer" 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="text-secondary" style={{fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block'}}>Key Skills (comma separated)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. React, Node.js, UI/UX" 
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-secondary" style={{fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block'}}>Experience Overview</label>
              <textarea 
                className="input-field" 
                style={{minHeight: '120px'}}
                placeholder="Briefly describe your past experience..." 
                value={formData.experience}
                onChange={e => setFormData({...formData, experience: e.target.value})}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isGenerating}>
              {isGenerating ? <><div className="spinner"></div> Generating...</> : <><Bot size={18} /> Generate Resume</>}
            </button>
          </form>
        </div>

        <div className="result-section">
          {!generatedResume && !isGenerating && !error && (
             <div className="empty-state glass-panel">
               <FileText size={48} className="text-secondary opacity-50" />
               <h3>Awaiting Details</h3>
               <p>Fill out the form to generate your AI resume.</p>
             </div>
          )}

          {error && !isGenerating && (
             <div className="error-state glass-panel" style={{borderColor: 'var(--danger)'}}>
               <p className="text-danger">{error}</p>
             </div>
          )}

          {generatedResume && !isGenerating && (
            <div className="results-card glass-panel animate-fade-in" style={{textAlign: 'left'}}>
               <div className="result-header" style={{justifyContent: 'space-between'}}>
                 <h2>Generated Resume</h2>
                 <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(generatedResume)}>
                   <Edit3 size={16} /> Copy Text
                 </button>
               </div>
               
               <div style={{background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', marginTop: '1rem', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-display)', fontSize: '0.95rem'}}>
                 {generatedResume}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
