import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LiveTicker from './components/LiveTicker';
import Footer from './components/Footer';
import Home from './pages/Home';
import JobAnalyzer from './pages/JobAnalyzer';
import LogoAnalysis from './pages/LogoAnalysis';
import Dashboard from './pages/Dashboard';
import ScamMap from './pages/ScamMap';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chatbot from './components/Chatbot';
import { useAuth } from './context/AuthContext';
import './App.css';

// Protected route: redirects to /login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <LiveTicker />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* All other routes require login */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/analyzer" element={<ProtectedRoute><JobAnalyzer /></ProtectedRoute>} />
            <Route path="/logo-analysis" element={<ProtectedRoute><LogoAnalysis /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><ScamMap /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <Chatbot />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
