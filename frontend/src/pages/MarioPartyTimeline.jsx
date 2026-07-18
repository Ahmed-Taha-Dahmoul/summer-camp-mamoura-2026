import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Play, Pause, FastForward, RotateCcw, ChevronLeft, ChevronRight, Trophy, Medal, Maximize, Minimize } from 'lucide-react';
import './MarioPartyTimeline.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function MarioPartyTimeline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [genderFilter, setGenderFilter] = useState('ALL'); // 'ALL', 'BOY', 'GIRL'
  const [viewState, setViewState] = useState('INTRO'); // 'INTRO', 'TIMELINE', 'LEADERBOARD'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

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
      setData(res.data);
      setCurrentRoundIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error enabling full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };



  const handleNextDay = () => {
    if (data) {
      if (currentRoundIndex < data.rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1);
      } else {
        setViewState('LEADERBOARD');
      }
    }
  };

  const handlePrevDay = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(prev => prev - 1);
    }
  };

  if (loading && !data) {
    return <div className="p-8 text-center timeline-panel text-gray-900 border-radius mb-8">Loading Timeline Data...</div>;
  }

  if (!data || data.rounds.length === 0) {
    return (
      <div className="p-8 text-center timeline-panel text-gray-900 border-radius mb-8">
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

  if (viewState === 'INTRO') {
    return (
      <div ref={containerRef} className="mario-timeline-container glass border-radius overflow-hidden mb-8 timeline-intro">
        <div className="absolute top-4 right-4 z-50">
           <button className="btn-icon timeline-panel p-2 border-radius" onClick={toggleFullscreen} title="Toggle Fullscreen">
             {isFullscreen ? <Minimize size={20} color="#4b5563" /> : <Maximize size={20} color="#4b5563" />}
           </button>
        </div>
        <h1>ملخص بطولة ألعاب المخيم الصيفي</h1>
        <button className="btn btn-primary" onClick={() => setViewState('TIMELINE')}>
          Start Timeline
        </button>
      </div>
    );
  }

  if (viewState === 'LEADERBOARD') {
    const finalLeaderboard = [...filteredGroups].map(g => ({
      ...g,
      final_score: currentRound.cumulative_points[g.id] || 0
    })).sort((a, b) => b.final_score - a.final_score);

    const top3 = [];
    if (finalLeaderboard.length >= 2) top3.push(finalLeaderboard[1]); // 2nd
    if (finalLeaderboard.length >= 1) top3.push(finalLeaderboard[0]); // 1st
    if (finalLeaderboard.length >= 3) top3.push(finalLeaderboard[2]); // 3rd

    return (
      <div ref={containerRef} className="mario-timeline-container glass border-radius overflow-hidden mb-8 timeline-leaderboard">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
           <button className="btn-icon timeline-panel p-2 border-radius" onClick={() => setViewState('TIMELINE')} title="Back to Timeline">
             <ChevronLeft size={20} color="#4b5563" />
           </button>
           <button className="btn-icon timeline-panel p-2 border-radius" onClick={toggleFullscreen} title="Toggle Fullscreen">
             {isFullscreen ? <Minimize size={20} color="#4b5563" /> : <Maximize size={20} color="#4b5563" />}
           </button>
        </div>
        
        <h2 className="text-4xl font-bold text-gray-900 mb-2 animate-pop-in text-center">
          Final Rankings
        </h2>
        
        {top3.length > 0 && (
          <div className="final-podium-container">
            {top3.map((group, index) => {
              let rank = 1;
              if (finalLeaderboard.length >= 2 && index === 0) rank = 2;
              else if (finalLeaderboard.length >= 1 && index === (finalLeaderboard.length >= 2 ? 1 : 0)) rank = 1;
              else rank = 3;

              return (
                <div key={group.id} className={`final-podium-step final-rank-${rank}`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="final-avatar-wrap">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="final-avatar" />
                    ) : (
                      <div className="final-avatar flex align-center justify-center text-2xl font-bold text-white" style={{ display: 'flex' }}>
                        {group.name.charAt(0)}
                      </div>
                    )}
                    {rank === 1 && <Trophy size={28} className="final-badge text-amber-400" />}
                    {rank === 2 && <Medal size={24} className="final-badge text-gray-400" />}
                    {rank === 3 && <Medal size={24} className="final-badge text-amber-700" />}
                  </div>
                  <span className="text-gray-900 font-bold mt-2 text-center">{group.name}</span>
                  <span className="text-amber-500 font-bold mb-2">{group.final_score} pts</span>
                  <div className="final-podium-block">
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {finalLeaderboard.length > 3 && (
          <div className="final-list-container">
            {finalLeaderboard.slice(3).map((group, index) => (
              <div key={group.id} className="summary-item animate-slide-in flex align-center justify-between glass-sm p-3 border-radius" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                <div className="flex align-center gap-4">
                  <span className="text-muted font-bold text-xl w-6 text-center">{index + 4}</span>
                  <div className="summary-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: `2px solid var(--primary)` }}>
                    {group.avatar ? (
                       <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                       <span style={{ background: 'var(--primary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                         {group.name.charAt(0)}
                       </span>
                     )}
                  </div>
                  <div className="text-gray-900 font-bold text-lg">{group.name}</div>
                </div>
                <div className="text-amber-500 font-bold text-lg">{group.final_score} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mario-timeline-container glass border-radius overflow-hidden mb-8">
      
      {/* Header & Controls */}
      <div className="timeline-header p-4 flex align-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h2 className="m-0 flex align-center gap-2 text-gray-900 font-bold text-2xl">
            🌟 Grand Star Timeline 🌟
          </h2>
          <p className="text-gray-500 m-0 mt-1">Watch the epic race to the finish!</p>
        </div>
        
        <div className="flex align-center gap-4 flex-wrap">
          
          <div className="gender-filter-wrap timeline-panel p-1 border-radius flex">
            <button className={`btn-filter ${genderFilter === 'ALL' ? 'active' : ''}`} onClick={() => setGenderFilter('ALL')}>Both</button>
            <button className={`btn-filter ${genderFilter === 'BOY' ? 'active' : ''}`} onClick={() => setGenderFilter('BOY')}>Boys</button>
            <button className={`btn-filter ${genderFilter === 'GIRL' ? 'active' : ''}`} onClick={() => setGenderFilter('GIRL')}>Girls</button>
          </div>
          
          <div className="playback-controls flex align-center gap-2 timeline-panel p-2 border-radius">
            <button className="btn-icon" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize size={20} color="#4b5563" /> : <Maximize size={20} color="#4b5563" />}
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }}></div>
            
            <button className="btn-icon" onClick={handlePrevDay} disabled={currentRoundIndex === 0} title="Previous Game">
              <ChevronLeft size={20} color={currentRoundIndex === 0 ? 'rgba(0,0,0,0.2)' : '#4b5563'} />
            </button>

            <button className="btn-icon" onClick={() => setCurrentRoundIndex(0)} title="Reset to Start">
              <RotateCcw size={20} color="#4b5563" />
            </button>

            <button className="btn-icon" onClick={handleNextDay} title={currentRoundIndex === data.rounds.length - 1 ? "Show Leaderboard" : "Next Game"}>
              <ChevronRight size={20} color="#4b5563" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="timeline-body-wrapper">
        {/* Visual Timeline SVG Graph */}
        <div className="timeline-graph-wrapper">
          
          {/* Round Indicator (Watermark style) */}
          <div key={currentRound.game_name} className="round-watermark animate-pop-in" style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '6rem', fontWeight: '900', color: '#000000',
            textAlign: 'center', pointerEvents: 'none', zIndex: 0
          }}>
            Round {currentRound.round_index}<br/>
            <span style={{ fontSize: '0.4em', opacity: 0.9 }}>{currentRound.game_name}</span>
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
                        width: `${Math.max(0, percentage)}%`,
                        minWidth: '24px',
                        backgroundColor: themeHex,
                        boxShadow: `0 0 15px ${themeHex}80`,
                        transition: `width 500ms ease-out`,
                      }}
                    >
                      {/* The Avatar Head */}
                      <div className="race-avatar-head avatar-glow" style={{ 
                        border: `3px solid white`,
                        '--themeColor': themeHex
                      }}>
                         {group.avatar ? (
                           <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                           <span style={{ background: themeHex, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.8rem' }}>
                             {group.name.charAt(0)}
                           </span>
                         )}
                      </div>
                      
                      {/* Lane Label */}
                      <div className="race-lane-label" style={{ color: themeHex, borderColor: themeHex }}>
                         {currentPts}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Summary Panel */}
        <div className="timeline-daily-summary timeline-panel border-radius">
          <div className="summary-header flex align-center gap-3 mb-6">
            <Trophy size={28} color="var(--primary)" />
            <h3 className="m-0 text-black font-black text-2xl" style={{ letterSpacing: '-0.5px' }}>{currentRound.game_name} Results</h3>
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
                  <div key={`${currentRoundIndex}-${win.group_id}`} className="summary-item animate-slide-in flex align-center justify-between glass-sm p-4 border-radius mb-3" style={{ borderLeft: `4px solid ${themeHex}`, animationDelay: `${i * 0.1}s`, background: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex align-center gap-4">
                      <div className="summary-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${themeHex}` }}>
                        {group.avatar ? (
                           <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                           <span style={{ background: themeHex, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                             {group.name.charAt(0)}
                           </span>
                         )}
                      </div>
                      <div>
                        <div className="text-black font-bold text-lg">{group.name}</div>
                        <div className="text-gray-500 font-medium text-sm">{win.game_name}</div>
                      </div>
                    </div>
                    <div className="text-success font-black text-xl">+{win.points} pts</div>
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
