import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './Wheel.css';

function Wheel() {
  const navigate = useNavigate();
  const [canSpin, setCanSpin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultPoints, setResultPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = '';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    checkStatus();
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          if (prev > 0) checkStatus(); // Re-check when hits 0
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/camp/wheel-status/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCanSpin(res.data.can_spin);
      setTimeRemaining(res.data.time_remaining_ms);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "Ready!";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;
    
    setIsSpinning(true);
    setCanSpin(false);
    
    try {
      const res = await axios.post(`${API_URL}/api/camp/spin-wheel/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const points = res.data.points;
      setResultPoints(points);
      
      // Calculate target angle
      // 1 Point -> 300deg, 3 Points -> 180deg, 0 Points -> 60deg
      let targetAngle = 0;
      if (points === 1) targetAngle = 300;
      else if (points === 3) targetAngle = 180;
      else targetAngle = 60;
      
      // Add random offset within the segment (-40 to +40) to make it look realistic
      const offset = Math.floor(Math.random() * 80) - 40;
      targetAngle += offset;
      
      // Add 5 full rotations (1800 deg)
      const newRotation = rotation + 1800 + (targetAngle - (rotation % 360));
      
      setRotation(newRotation);
      
      // Wait for animation to finish (5s)
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        checkStatus(); // Get new timer
      }, 5500);
      
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error spinning the wheel.");
      setIsSpinning(false);
      checkStatus();
    }
  };

  return (
    <div className="wheel-container">
      <button 
        onClick={() => navigate('/')} 
        style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 100, fontSize: '1rem', fontWeight: 600 }}
      >
        <ChevronLeft size={24} /> Back
      </button>

      <div className="wheel-header">
        <h1>Wheel of Fortune</h1>
        <p>Spin to win points for your Patrol!</p>
      </div>

      <div className="wheel-wrapper">
        <div className="wheel-pointer"></div>
        <div 
          className="wheel-circle"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Labels 
              conic-gradient:
              1 Point: 0-120 (blue)
              3 Points: 120-240 (yellow)
              Try Again: 240-360 (red)
          */}
          <div className="wheel-label" style={{ transform: 'rotate(-30deg) translate(50px, -50%)' }}>
            1 POINT
          </div>
          <div className="wheel-label" style={{ transform: 'rotate(90deg) translate(50px, -50%)' }}>
            3 POINTS
          </div>
          <div className="wheel-label" style={{ transform: 'rotate(210deg) translate(50px, -50%)' }}>
            TRY AGAIN
          </div>
        </div>
      </div>

      <button 
        className="spin-btn" 
        onClick={handleSpin}
        disabled={!canSpin || isSpinning || loading}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
      </button>
      
      {!canSpin && !isSpinning && !loading && (
        <div className="timer-text">
          Next spin in: {formatTime(timeRemaining)}
        </div>
      )}

      {showResult && (
        <div className="result-modal-overlay">
          <div className="result-modal">
            <h2 style={{ color: resultPoints > 0 ? '#fbbf24' : 'white' }}>
              {resultPoints > 0 ? `🎉 ${resultPoints} Points!` : 'Not this time!'}
            </h2>
            <p>{resultPoints > 0 ? "Points successfully added to your patrol's score." : "Better luck on your next spin. Come back in 5 hours!"}</p>
            <button onClick={() => setShowResult(false)}>Awesome</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wheel;
