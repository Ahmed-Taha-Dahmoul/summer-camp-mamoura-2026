import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal } from 'lucide-react';
import './Games.css';

function Games() {
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/camp/leaderboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGames(res.data.games);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={28} className="rank-icon rank-gold" />;
    if (index === 1) return <Medal size={26} className="rank-icon rank-silver" />;
    if (index === 2) return <Medal size={26} className="rank-icon rank-bronze" />;
    return <span className="rank-number">{index + 1}</span>;
  };

  const getLocalUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url).pathname;
    } catch {
      return url.replace(/^https?:\/\/[^\/]+/, '');
    }
  };

  if (loading) {
    return <div className="container text-center py-20 text-white">Loading Leaderboard...</div>;
  }

  return (
    <div className="games-page animate-fade-in">
      <div className="games-hero">
        <div className="container text-center">
          <h1 className="premium-title mb-2">Camp <span className="gradient-text text-amber-500">Games</span></h1>
          <p className="premium-subtitle">Live Patrol Leaderboard</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="glass border-radius overflow-hidden shadow-xl leaderboard-container">
          <div className="table-responsive">
            <table className="leaderboard-table w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="th-rank text-center p-4">Rank</th>
                  <th className="th-patrol p-4 min-w-200">Patrol</th>
                  {games.map(game => (
                    <th key={game.id} className="th-game p-4 text-center whitespace-nowrap">
                      {game.name}
                    </th>
                  ))}
                  <th className="th-total p-4 text-center font-bold">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((group, index) => (
                  <tr key={group.group_id} className={`tr-patrol ${index < 3 ? 'top-3-row' : ''} ${index === 0 ? 'first-place-row' : ''}`}>
                    <td data-label="Rank" className="td-rank text-center p-4 align-middle">
                      <div className="flex justify-center items-center h-full">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td data-label="Patrol" className="td-patrol p-4 align-middle">
                      <div className="flex align-center gap-3">
                        {group.group_profile && (
                          <div className="patrol-avatar flex-shrink-0">
                            <img src={getLocalUrl(group.group_profile)} alt="" className="avatar-img" />
                          </div>
                        )}
                        <span className={`patrol-name font-bold ${index === 0 ? 'text-gold text-lg' : 'text-white'}`}>
                          {group.group_name}
                        </span>
                      </div>
                    </td>
                    
                    {games.map(game => (
                      <td data-label={game.name} key={game.id} className="td-score text-center p-4 font-medium align-middle">
                        <span className="score-badge">{group.scores[game.id] || '-'}</span>
                      </td>
                    ))}
                    
                    <td data-label="Total Score" className="td-total text-center p-4 font-bold text-lg align-middle bg-total">
                      <span className="total-badge">{group.total_score}</span>
                    </td>
                  </tr>
                ))}
                
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={games.length + 3} className="text-center p-8 text-muted italic">
                      No scores recorded yet. Let the games begin!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Games;
