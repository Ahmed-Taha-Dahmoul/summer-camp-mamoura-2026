import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Dices, Gift } from 'lucide-react';
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
  const [recentWinners, setRecentWinners] = useState([]);

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

      const winnersRes = await axios.get(`${API_URL}/api/camp/wheel-winners/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentWinners(winnersRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "Ready to spin!";
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
      let targetAngle = 0;
      if (points === 1) targetAngle = 300;
      else if (points === 3) targetAngle = 180;
      else targetAngle = 60;

      // Add random offset within the segment (-35 to +35)
      const offset = Math.floor(Math.random() * 70) - 35;
      targetAngle += offset;

      // Add 6 full rotations (2160 deg) for a long dramatic spin
      const newRotation = rotation + 2160 + (targetAngle - (rotation % 360));

      setRotation(newRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        checkStatus();
      }, 6500); // Wait 6.5s for the CSS animation

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error spinning the wheel.");
      setIsSpinning(false);
      checkStatus();
    }
  };

  if (loading) {
    return <div className="wheel-page-premium flex justify-center items-center h-screen text-white">Loading...</div>;
  }

  return (
    <div className="wheel-page-premium animate-fade-in">
      <div className="wheel-top-nav container">
        <button onClick={() => navigate('/')} className="wheel-back-btn">
          <ChevronLeft size={24} /> <span>Retour</span>
        </button>
      </div>

      <div className="wheel-hero-section">
        <div className="container text-center">
          <div className="flex justify-center mb-4">
            <div className="wheel-icon-badge">
              <Dices size={32} color="#fbbf24" />
            </div>
          </div>
          <h1 className="premium-title mb-2">
            Roulette <span className="gradient-text text-amber-500">Kachfiya</span>
          </h1>
          <p className="premium-subtitle" style={{ maxWidth: '400px', margin: '0 auto', fontSize: '1.1rem' }}>
            Tentez votre chance ! Tournez la roue toutes les 5 heures pour gagner des points pour votre Taliaa (طليعة).
          </p>
        </div>
      </div>

      <div className="container pb-12 wheel-main-layout">
        <div className="wheel-showcase-container glass">

          <div className="wheel-svg-wrapper">
            <div className="wheel-svg-pointer">
              <svg viewBox="0 0 40 40" width="40" height="40" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.6))' }}>
                <path d="M 20 40 L 5 10 A 15 15 0 0 1 35 10 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div
              className="wheel-svg-spin"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 200 200" width="100%" height="100%">
                <defs>
                  <linearGradient id="gold-slice" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="blue-slice" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="dark-slice" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>
                </defs>

                {/* Outer border */}
                <circle cx="100" cy="100" r="98" fill="#18181b" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />

                {/* Slices: R=98. Center=100,100 */}
                {/* 1 POINT (0 to 120 deg) */}
                <path d="M 100 100 L 100 2 A 98 98 0 0 1 184.8 149 Z" fill="url(#blue-slice)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                {/* 3 POINTS (120 to 240 deg) */}
                <path d="M 100 100 L 184.8 149 A 98 98 0 0 1 15.2 149 Z" fill="url(#gold-slice)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                {/* TRY AGAIN (240 to 360 deg) */}
                <path d="M 100 100 L 15.2 149 A 98 98 0 0 1 100 2 Z" fill="url(#dark-slice)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                {/* Text Labels */}
                <g transform="rotate(60 100 100)">
                  <text x="100" y="32" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '1px' }}>1 POINT</text>
                </g>
                <g transform="rotate(180 100 100)">
                  <text x="100" y="32" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '1px' }}>3 POINTS</text>
                </g>
                <g transform="rotate(300 100 100)">
                  <text x="100" y="32" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '1px' }}>TRY AGAIN</text>
                </g>

                {/* Inner Hub */}
                <circle cx="100" cy="100" r="16" fill="#18181b" stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                <circle cx="100" cy="100" r="6" fill="#fbbf24" />
              </svg>
            </div>
          </div>

          <div className="wheel-controls mt-8">
            <button
              className={`btn btn-large w-full flex justify-center align-center gap-2 ${canSpin && !isSpinning && !loading ? 'wheel-spin-btn-active' : 'wheel-spin-btn-disabled'}`}
              onClick={handleSpin}
              disabled={!canSpin || isSpinning || loading}
              style={{ fontSize: '1.2rem', padding: '1.2rem', borderRadius: '16px' }}
            >
              {isSpinning ? (
                <span>En cours...</span>
              ) : (
                <>
                  <Gift size={22} />
                  <span>Tourner la Roue</span>
                </>
              )}
            </button>

            {!canSpin && !isSpinning && !loading && (
              <div className="wheel-timer-box mt-4">
                <Clock size={18} color="#f59e0b" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

        </div>

        {/* Recent Winners Sidebar */}
        <div className="wheel-winners-container glass" style={{ height: 'fit-content' }}>
          <h3 className="flex items-center gap-2 mb-4 text-white" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span> Derniers Gagnants
          </h3>
          <div className="flex flex-col gap-3">
            {recentWinners.length > 0 ? recentWinners.map((winner, idx) => (
              <div key={idx} className="winner-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-white">{winner.username}</span>
                  <span className="text-amber-400 font-bold text-sm">+{winner.points} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{winner.group_name}</span>
                  <span className="text-xs text-gray-500">{winner.time_ago}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 italic">Aucun gagnant récent.</p>
            )}
          </div>
        </div>
      </div>

      {showResult && (
        <div className="wheel-modal-overlay" onClick={() => setShowResult(false)}>
          <div className="wheel-modal-card glass" onClick={(e) => e.stopPropagation()}>
            <div className={`wheel-modal-icon ${resultPoints > 0 ? 'win-anim' : ''}`}>
              {resultPoints > 0 ? '🏆' : '😅'}
            </div>
            <h2>{resultPoints > 0 ? `+${resultPoints} Points !` : 'Pas cette fois'}</h2>
            <p>
              {resultPoints > 0
                ? "Félicitations ! Les points ont été ajoutés au score de votre patrouille."
                : "Dommage ! Revenez dans 5 heures pour tenter à nouveau votre chance."}
            </p>
            <button className="btn btn-secondary w-full" style={{ padding: '1rem', borderRadius: '12px' }} onClick={() => setShowResult(false)}>
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wheel;
