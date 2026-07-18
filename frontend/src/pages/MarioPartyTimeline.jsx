import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Play, Pause, FastForward, RotateCcw, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import './MarioPartyTimeline.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MarioPartyTimeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [genderFilter, setGenderFilter] = useState('ALL'); // 'ALL', 'BOY', 'GIRL'

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_URL}/api/camp/timeline/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setCurrentRoundIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const handleNextDay = () => {
    if (data && currentRoundIndex < data.rounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    }
  };

  const handlePrevDay = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(prev => prev - 1);
    }
  };

  if (loading && !data) {
    return <div className="p-8 text-center glass text-white border-radius mb-8">Loading Timeline Data...</div>;
  }

  if (!data || data.rounds.length === 0) {
    return (
      <div className="p-8 text-center glass text-white border-radius mb-8">
        <h3>No Timeline Data</h3>
      </div>
    );
  }

  const currentRound = data.rounds[currentRoundIndex];
  
  // Filter groups
  const filteredGroups = data.groups.filter(g => {
    if (genderFilter === 'ALL') return true;
    return g.gender === genderFilter;
  });

  // Calculate max points for scale based on filtered groups
  let maxPoints = 10;
  data.rounds.forEach(r => {
    filteredGroups.forEach(g => {
      const pts = r.cumulative_points[g.id] || 0;
      if (pts > maxPoints) maxPoints = pts;
    });
  });
  
  maxPoints = Math.ceil(maxPoints * 1.1);
  if (maxPoints < 20) maxPoints = 20;

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
        
        <div className="flex align-center gap-4 flex-wrap">
          
          <div className="gender-filter-wrap bg-black-40 p-1 border-radius flex">
            <button className={`btn-filter ${genderFilter === 'ALL' ? 'active' : ''}`} onClick={() => setGenderFilter('ALL')}>Both</button>
            <button className={`btn-filter ${genderFilter === 'BOY' ? 'active' : ''}`} onClick={() => setGenderFilter('BOY')}>Boys</button>
            <button className={`btn-filter ${genderFilter === 'GIRL' ? 'active' : ''}`} onClick={() => setGenderFilter('GIRL')}>Girls</button>
          </div>
          
          <div className="playback-controls flex align-center gap-2 bg-black-40 p-2 border-radius">
            <button className="btn-icon" onClick={handlePrevDay} disabled={currentRoundIndex === 0} title="Previous Day">
              <ChevronLeft size={20} color={currentRoundIndex === 0 ? 'rgba(255,255,255,0.3)' : 'white'} />
            </button>

            <button className="btn-icon" onClick={() => setCurrentRoundIndex(0)} title="Reset">
              <RotateCcw size={20} color="white" />
            </button>

            <button className="btn-icon" onClick={handleNextDay} disabled={currentRoundIndex === data.rounds.length - 1} title="Next Day">
              <ChevronRight size={20} color={currentRoundIndex === data.rounds.length - 1 ? 'rgba(255,255,255,0.3)' : 'white'} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="timeline-body-wrapper">
        {/* Visual Timeline SVG Graph */}
        <div className="timeline-graph-wrapper">
          
          {/* Round Indicator (Watermark style) */}
          <div className="round-watermark" style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)',
            textAlign: 'center', pointerEvents: 'none', zIndex: 0
          }}>
            Round {currentRound.round_index}<br/>
            <span style={{ fontSize: '0.4em', opacity: 0.7 }}>{currentRound.game_name}</span>
          </div>
        
          <div className="graph-axes">
            {/* Group Bars (Race Mode) */}
            <div className="race-track-container">
              {filteredGroups.map((group, idx) => {
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
                  <div key={group.id} className="race-lane">
                    {/* The Bar */}
                    <div 
                      className="race-bar"
                      style={{ 
                        width: `${Math.max(1, percentage)}%`,
                        backgroundColor: themeHex,
                        boxShadow: `0 0 15px ${themeHex}80`,
                        transition: `width 500ms ease-out`,
                      }}
                    >
                      {/* The Avatar Head */}
                      <div className="race-avatar-head" style={{ 
                        border: `3px solid ${themeHex}`,
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
                    <div className="race-lane-label">
                       <div style={{ color: themeHex }}>{currentPts}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Summary Panel */}
        <div className="timeline-daily-summary bg-black-40 border-radius">
          <div className="summary-header flex align-center gap-2 mb-4">
            <Trophy size={20} color="var(--primary)" />
            <h3 className="m-0 text-white font-bold">{currentRound.game_name} Results</h3>
          </div>
          
          <div className="summary-list">
            {currentRound.won_games && currentRound.won_games.length > 0 ? (
              currentRound.won_games.map((win, i) => {
                const group = data.groups.find(g => g.id === win.group_id);
                if (!group) return null;
                if (genderFilter !== 'ALL' && group.gender !== genderFilter) return null;
                
                const colorMap = {
                  'red': '#ef4444',
                  'green': '#10b981',
                  'purple': '#a855f7',
                  'gold': '#f59e0b',
                  'blue': '#3b82f6'
                };
                const themeHex = colorMap[group.theme_color] || '#3b82f6';

                return (
                  <div key={i} className="summary-item flex align-center justify-between glass-sm p-3 border-radius mb-2" style={{ borderLeft: `4px solid ${themeHex}` }}>
                    <div className="flex align-center gap-3">
                      <div className="summary-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${themeHex}` }}>
                        {group.avatar ? (
                           <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                           <span style={{ background: themeHex, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
                             {group.name.charAt(0)}
                           </span>
                         )}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{group.name}</div>
                        <div className="text-muted text-xs">{win.game_name}</div>
                      </div>
                    </div>
                    <div className="text-success font-bold text-sm">+{win.points} pts</div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted p-4">No points awarded for this game.</div>
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}
