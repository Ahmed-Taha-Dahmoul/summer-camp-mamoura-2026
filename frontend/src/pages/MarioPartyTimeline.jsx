import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Play, Pause, FastForward, RotateCcw } from 'lucide-react';
import './MarioPartyTimeline.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MarioPartyTimeline() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Animation speed control
  const [speed, setSpeed] = useState(1500); 

  useEffect(() => {
    fetchTimelineData();
  }, [startDate]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_URL}/api/camp/timeline/?start_date=${startDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setCurrentRoundIndex(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Playback logic
  useEffect(() => {
    let interval = null;
    if (isPlaying && data && currentRoundIndex < data.rounds.length - 1) {
      interval = setInterval(() => {
        setCurrentRoundIndex(prev => {
          if (prev >= data.rounds.length - 2) {
            setIsPlaying(false);
            return data.rounds.length - 1;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentRoundIndex, data, speed]);

  const handlePlayPause = () => {
    if (currentRoundIndex >= (data?.rounds?.length || 1) - 1) {
      setCurrentRoundIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  if (loading && !data) {
    return <div className="p-8 text-center glass text-white border-radius mb-8">Loading Timeline Data...</div>;
  }

  if (!data || data.rounds.length === 0) {
    return (
      <div className="p-8 text-center glass text-white border-radius mb-8">
        <h3>No Timeline Data</h3>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="premium-select mt-4" style={{ background: '#1c1c1e', color: 'white' }} />
      </div>
    );
  }

  // Calculate max points for scale
  let maxPoints = 10;
  data.rounds.forEach(r => {
    Object.values(r.cumulative_points).forEach(pts => {
      if (pts > maxPoints) maxPoints = pts;
    });
  });
  
  maxPoints = Math.ceil(maxPoints * 1.1);
  if (maxPoints < 20) maxPoints = 20;

  const currentRound = data.rounds[currentRoundIndex];
  
  return (
    <div className="mario-timeline-container glass border-radius overflow-hidden mb-8">
      
      {/* Header & Controls */}
      <div className="timeline-header p-4 flex align-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h2 className="m-0 flex align-center gap-2 text-white font-bold text-2xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            🌟 Grand Star Timeline 🌟
          </h2>
          <p className="text-muted m-0 mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Watch the epic race to the finish!</p>
        </div>
        
        <div className="flex align-center gap-4">
          <div className="date-picker-wrap flex align-center gap-2">
            <Calendar size={18} className="text-muted" style={{ color: 'rgba(255,255,255,0.7)' }} />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="premium-select"
              style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
            />
          </div>
          
          <div className="playback-controls flex align-center gap-2 bg-black-40 p-2 border-radius">
            <button className="btn-icon" onClick={() => setCurrentRoundIndex(0)} title="Reset">
              <RotateCcw size={20} color="white" />
            </button>
            <button className="btn btn-primary flex align-center justify-center" style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }} onClick={handlePlayPause}>
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '3px' }} />}
            </button>
            <button className="btn-icon" onClick={() => setSpeed(speed === 1500 ? 500 : 1500)} title="Speed">
              <FastForward size={20} color={speed === 500 ? 'var(--primary)' : 'white'} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Visual Timeline SVG Graph */}
      <div className="timeline-graph-wrapper" style={{ position: 'relative', height: '500px', width: '100%', padding: '2rem 4rem' }}>
        
        {/* Round Indicator (Watermark style) */}
        <div className="round-watermark" style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)',
          textAlign: 'center', pointerEvents: 'none', zIndex: 0
        }}>
          Round {currentRound.round_index}<br/>
          <span style={{ fontSize: '0.4em', opacity: 0.7 }}>{currentRound.date}</span>
        </div>
      
        <div className="graph-axes" style={{ position: 'relative', height: '100%', width: '100%', borderLeft: '2px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', zIndex: 10 }}>
          {/* Group Bars (Race Mode) */}
          <div className="race-track-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
            {data.groups.map((group, idx) => {
              const currentPts = currentRound.cumulative_points[group.id] || 0;
              const percentage = (currentPts / maxPoints) * 100;
              
              const colorMap = {
                'red': '#ef4444',
                'green': '#10b981',
                'purple': '#a855f7',
                'gold': '#f59e0b',
                'blue': '#3b82f6'
              };
              const themeHex = colorMap[group.theme_color] || '#3b82f6';
              
              return (
                <div key={group.id} className="race-lane" style={{ position: 'relative', width: '100%', height: '40px', display: 'flex', alignItems: 'center' }}>
                  
                  {/* The Bar */}
                  <div 
                    className="race-bar"
                    style={{ 
                      width: `${Math.max(1, percentage)}%`,
                      height: '24px',
                      backgroundColor: themeHex,
                      boxShadow: `0 0 15px ${themeHex}80`,
                      borderRadius: '0 12px 12px 0',
                      transition: `width ${speed}ms linear`,
                      position: 'relative'
                    }}
                  >
                    {/* The Avatar Head */}
                    <div className="race-avatar-head" style={{ 
                      position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%)',
                      width: '48px', height: '48px', borderRadius: '50%',
                      border: `3px solid ${themeHex}`,
                      background: '#111',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                      zIndex: 20
                    }}>
                       {group.avatar ? (
                         <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <span style={{ background: themeHex, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                           {group.name.charAt(0)}
                         </span>
                       )}
                    </div>
                  </div>
                  
                  {/* Lane Label */}
                  <div className="race-lane-label" style={{ position: 'absolute', left: '-4rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', width: '3.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                     <div style={{ color: themeHex, fontSize: '1.1rem', marginBottom: '-4px' }}>{currentPts}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
}
