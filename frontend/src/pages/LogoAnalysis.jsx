import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, ImageIcon } from 'lucide-react';
import { saveAnalysis } from '../utils/analysisHistory';

import './LogoAnalysis.css';

const LogoAnalysis = () => {
  const isDemoMode = false;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isDemoMode) {
      setPreview('https://via.placeholder.com/150/FF0000/FFFFFF?text=Faked+Logo');
    } else {
      setFile(null);
      setPreview(null);
      setResult(null);
    }
  }, [isDemoMode]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!preview && !isDemoMode) return;
    setIsAnalyzing(true);

    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 2000));
        const demoResult = {
          authenticity: "Low",
          details: "This image shows signs of heavy compression artifacts, incorrect proportions, and a mismatched font compared to the official company logo. This is highly indicative of a forged or copied logo often used in phishing and scam job postings."
        };
        setResult(demoResult);
        saveAnalysis({
          verdict: 'Fake',
          score: 85,
          riskLevel: 'High',
        }, 'logo', 'demo-logo');
      } else {
        const formData = new FormData();
        formData.append('logo', file);
        const res = await fetch('http://localhost:5000/api/analyze/logo', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setResult(data);
        // Save to analysis history so Dashboard Trends update correctly
        const verdict = data.authenticity === 'High' ? 'Genuine' : data.authenticity === 'Medium' ? 'Suspicious' : 'Fake';
        const score = data.authenticity === 'High' ? 10 : data.authenticity === 'Medium' ? 50 : 85;
        const riskLevel = data.authenticity === 'High' ? 'Low' : data.authenticity === 'Medium' ? 'Medium' : 'High';
        saveAnalysis({ verdict, score, riskLevel }, 'logo', file?.name || 'logo');
      }
    } catch (error) {
      console.error("Error analyzing logo", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="logo-page container animate-fade-in">
      <header className="page-header">
        <h1>Logo Authentication</h1>
        <p>Upload a company logo from a job offer to check its authenticity using Gemini Vision.</p>
      </header>

      <div className="logo-container glass-panel">
        <div 
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Logo Preview" className="logo-preview" />
              <button className="btn btn-secondary mt-4" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                Clear Image
              </button>
            </div>
          ) : (
            <div className="upload-prompt">
              <Upload size={48} className="text-secondary" />
              <h3>Drag & Drop a logo here</h3>
              <p>or click to browse files</p>
              <input type="file" className="file-input" accept="image/*" onChange={handleFileChange} />
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary btn-analyze" 
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!file && !isDemoMode)}
        >
          {isAnalyzing ? "Analyzing Logo Quality..." : "Verify Authenticity"}
        </button>

        {result && (
          <div className="logo-result animate-fade-in">
            <div className="result-badge" style={{
              backgroundColor: result.authenticity === 'High' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: result.authenticity === 'High' ? 'var(--success)' : 'var(--danger)'
            }}>
              {result.authenticity === 'High' ? <CheckCircle /> : <AlertTriangle />}
              <span>{result.authenticity} Authenticity</span>
            </div>
            <p className="logo-details">{result.details}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoAnalysis;
