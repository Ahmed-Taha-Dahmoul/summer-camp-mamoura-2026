import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, RotateCcw, Trophy, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PianoGame.css';

const COLS = 4;
const INITIAL_SPEED = 5; // pixels per frame
const TILE_HEIGHT = 160; // height of a tile

export default function PianoGame() {
  const [gameState, setGameState] = useState('start'); // 'start', 'countdown', 'playing', 'gameover'
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [remainingPlays, setRemainingPlays] = useState(3);
  const [userRank, setUserRank] = useState(null);
  const [userBestScore, setUserBestScore] = useState(0);
  
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const [, setRenderTrigger] = useState(0); 
  const audioCtxRef = useRef(null);
  const bgmRef = useRef(null);
  
  const stateRef = useRef({
    tiles: [],
    speed: INITIAL_SPEED,
    score: 0,
    lastY: 0, 
    containerHeight: 0,
    isGameOver: false
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Play a silent sound to completely unlock iOS Safari audio
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0; // silent
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.01);
    } catch (e) {}
  };

  const playNote = (currentScore) => {
    try {
      if (!audioCtxRef.current) return;
      const audioCtx = audioCtxRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'triangle'; // Sounds a bit more melodic than sine
      // Frequencies for a catchy pentatonic scale or simple C major
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      oscillator.frequency.value = notes[currentScore % notes.length];
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const playCountdownBeep = (isFinal) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  };

  const startHypeBeat = () => {
    if (bgmRef.current) clearInterval(bgmRef.current);
    bgmRef.current = setInterval(() => {
      if (stateRef.current.isGameOver || !audioCtxRef.current) {
        clearInterval(bgmRef.current);
        return;
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }, 350); // fast beat
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/api/camp/piano-scores/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setLeaderboard(res.data);
      } else {
        setLeaderboard(res.data.leaderboard || []);
        setRemainingPlays(res.data.remaining_plays !== undefined ? res.data.remaining_plays : 3);
        setUserRank(res.data.user_rank);
        setUserBestScore(res.data.user_best_score || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startGame = () => {
    initAudio(); // Must be called from user interaction
    setGameState('countdown');
    setCountdown(3);
    playCountdownBeep(false);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(false);
      } else {
        clearInterval(interval);
        playCountdownBeep(true);
        initGame();
      }
    }, 1000);
  };

  const initGame = () => {
    setGameState('playing');
    setScore(0);
    const height = containerRef.current ? containerRef.current.clientHeight : window.innerHeight;
    stateRef.current = {
      tiles: [],
      speed: INITIAL_SPEED,
      score: 0,
      lastY: -TILE_HEIGHT,
      containerHeight: height,
      isGameOver: false
    };
    
    // Spawn initial tiles
    for (let i = 0; i < 5; i++) {
      spawnTile(stateRef.current.lastY - TILE_HEIGHT);
    }

    startHypeBeat();
    requestRef.current = requestAnimationFrame(updateGame);
  };

  const spawnTile = (yPos) => {
    stateRef.current.tiles.push({
      id: Math.random().toString(36).substr(2, 9),
      col: Math.floor(Math.random() * COLS),
      y: yPos,
      clicked: false
    });
    stateRef.current.lastY = yPos;
  };

  const updateGame = () => {
    if (stateRef.current.isGameOver) return;

    const state = stateRef.current;
    state.speed = INITIAL_SPEED + (state.score * 0.2); // Increase speed over time
    
    let missed = false;

    // Move tiles down
    for (let i = 0; i < state.tiles.length; i++) {
      state.tiles[i].y += state.speed;
      
      // Check if unclicked tile hit bottom (buffer of 20px)
      if (state.tiles[i].y > state.containerHeight && !state.tiles[i].clicked) {
        state.tiles[i].wrong = true; // Mark as missed for red styling
        missed = true;
      }
    }

    if (missed) {
      gameOver();
      return;
    }

    // Remove tiles that are way off screen
    state.tiles = state.tiles.filter(t => t.y < state.containerHeight + TILE_HEIGHT);

    // Spawn new tile if needed
    const highestTile = state.tiles[state.tiles.length - 1];
    if (!highestTile || highestTile.y > 0) {
      spawnTile(highestTile ? highestTile.y - TILE_HEIGHT : -TILE_HEIGHT);
    }

    setRenderTrigger(prev => prev + 1); // Force re-render for positions
    requestRef.current = requestAnimationFrame(updateGame);
  };

  const handleTouch = (colIndex) => {
    if (stateRef.current.isGameOver || gameState !== 'playing') return;

    const state = stateRef.current;
    
    // Find the lowest unclicked tile
    const unclickedTiles = state.tiles.filter(t => !t.clicked);
    if (unclickedTiles.length === 0) return;

    const targetTile = unclickedTiles[0];

    // Give a little leniency: tile must be visible
    if (targetTile.col === colIndex) {
      // Correct tap
      targetTile.clicked = true;
      state.score += 1;
      setScore(state.score);
      playNote(state.score);
    } else {
      // Wrong tap
      // We can create a fake red tile at the tapped col for feedback
      state.tiles.push({
        id: 'wrong-' + Date.now(),
        col: colIndex,
        y: targetTile.y,
        clicked: false,
        wrong: true
      });
      gameOver();
    }
  };

  const gameOver = async () => {
    stateRef.current.isGameOver = true;
    if (bgmRef.current) clearInterval(bgmRef.current);
    cancelAnimationFrame(requestRef.current);
    
    // Play fail sound
    if (audioCtxRef.current) {
        try {
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }

    setGameState('gameover');
    setRenderTrigger(prev => prev + 1); // Render final state (red tiles)
    
    // Submit score
    if (stateRef.current.score > 0) {
        try {
          const token = localStorage.getItem('access_token');
          await axios.post('/api/camp/piano-scores/', { score: stateRef.current.score }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchLeaderboard();
        } catch (err) {
          console.error("Failed to save score", err);
        }
    }
  };

  const renderTiles = () => {
    return stateRef.current.tiles.map((tile) => {
      let className = "piano-tile";
      if (tile.clicked) className += " clicked";
      if (tile.wrong) className += " wrong";

      return (
        <div
          key={tile.id}
          className={className}
          style={{
            left: `${(tile.col / COLS) * 100}%`,
            top: `${tile.y}px`,
            width: `${100 / COLS}%`,
            height: `${TILE_HEIGHT}px`
          }}
        />
      );
    });
  };

  return (
    <div className="piano-game-container animate-fade-in">
      <div className="piano-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        {gameState === 'playing' && (
          <div className="live-score">{score}</div>
        )}
      </div>

      <div className="game-area" ref={containerRef}>
        {/* The columns overlay - intercepts touches */}
        <div className="columns-overlay">
          {[0, 1, 2, 3].map(col => (
            <div 
              key={col} 
              className="game-column"
              onPointerDown={(e) => {
                e.preventDefault(); // Prevents double firing with touch
                handleTouch(col);
              }}
            />
          ))}
        </div>

        {/* Render lines for columns */}
        {[1, 2, 3].map(line => (
          <div key={line} className="column-divider" style={{ left: `${line * 25}%` }} />
        ))}

        {(gameState === 'playing' || gameState === 'gameover') && renderTiles()}
      </div>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="overlay-screen glass">
          <Trophy size={64} className="text-amber-500 mb-4" />
          <h1 className="premium-title mb-2 text-center" style={{ fontSize: '2.5rem' }}>Piano Tiles</h1>
          <p className="text-gray-300 mb-2 text-center">Daily Plays Remaining: <span className="font-bold text-white">{remainingPlays}/3</span></p>
          <p className="text-gray-400 mb-8 text-sm text-center">Tap the black tiles. Don't tap anywhere else!</p>
          <button 
            className={`btn btn-secondary btn-large w-full max-w-xs justify-center ${remainingPlays <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={remainingPlays <= 0}
            onPointerDown={(e) => {
              if (remainingPlays <= 0) return;
              e.preventDefault();
              startGame();
            }}
          >
            <Play size={24} /> {remainingPlays > 0 ? "Play Now" : "Come Back Tomorrow"}
          </button>

          <div className="leaderboard-preview mt-8 w-full max-w-xs">
            <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2">
              <Trophy size={18} className="text-amber-500"/> Top Scores
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-muted text-center">No scores yet. Be the first!</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.slice(0, 5).map((l, i) => (
                  <div key={l.id} className="leaderboard-item">
                    <span className="rank">{i + 1}</span>
                    {l.profile_picture ? (
                       <img src={l.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="" className="avatar" />
                    ) : (
                       <div className="avatar-placeholder">{l.username.charAt(0)}</div>
                    )}
                    <span className="name">{l.username}</span>
                    <span className="score">{l.score}</span>
                  </div>
                ))}
              </div>
            )}
            {userRank && (
              <div className="mt-4 text-center text-gray-300 text-sm">
                Your Global Rank: <span className="text-amber-500 font-bold">#{userRank}</span> 
                {userBestScore > 0 && <span> (Best: {userBestScore})</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown Screen */}
      {gameState === 'countdown' && (
        <div className="overlay-screen countdown-screen">
          <div className="countdown-number pop-animation">{countdown}</div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="overlay-screen gameover-screen glass">
          <h2 className="premium-title mb-2 text-red-500">Game Over!</h2>
          <div className="final-score mb-2">Score: {score}</div>
          <div className="text-gray-300 mb-6 flex flex-col items-center gap-1 text-sm">
             <div>Your Best: <span className="text-white font-bold">{Math.max(score, userBestScore)}</span></div>
             {userRank && <div>Global Rank: <span className="text-amber-500 font-bold">#{userRank}</span></div>}
             <div className="mt-2 text-xs text-gray-400">Plays remaining: {remainingPlays}/3</div>
          </div>
          
          <button 
            className={`btn btn-secondary btn-large mb-4 w-full max-w-xs justify-center ${remainingPlays <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={remainingPlays <= 0}
            onPointerDown={(e) => {
              if (remainingPlays <= 0) return;
              e.preventDefault();
              startGame();
            }}
          >
            <RotateCcw size={24} /> {remainingPlays > 0 ? "Play Again" : "No Plays Left"}
          </button>

          <button className="btn btn-outline-hero btn-large mb-4 w-full max-w-xs justify-center" onClick={() => navigate('/')}>
            <Home size={24} /> Return to Home
          </button>
          
          <div className="leaderboard-preview mt-4 w-full max-w-xs">
            <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2">
               <Trophy size={18} className="text-amber-500"/> Leaderboard
            </h3>
            <div className="leaderboard-list">
              {leaderboard.slice(0, 5).map((l, i) => (
                <div key={l.id} className="leaderboard-item">
                  <span className="rank">{i + 1}</span>
                  {l.profile_picture ? (
                     <img src={l.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="" className="avatar" />
                  ) : (
                     <div className="avatar-placeholder">{l.username.charAt(0)}</div>
                  )}
                  <span className="name">{l.username}</span>
                  <span className="score">{l.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
