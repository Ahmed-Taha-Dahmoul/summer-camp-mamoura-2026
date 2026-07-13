import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Users, Flower2 } from 'lucide-react';
import './Games.css';

function Games() {
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('BOY');
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

  const renderPodium = () => {
    const filteredLeaderboard = leaderboard.filter(group => group.group_gender === activeTab);
    
    // Need at least something to show, but optimally 3. If less than 3, just skip or handle gracefully.
    // We will place them as [2nd, 1st, 3rd] for a classic podium layout.
    const top3 = [];
    if (filteredLeaderboard.length >= 2) top3.push(filteredLeaderboard[1]); // 2nd place
    if (filteredLeaderboard.length >= 1) top3.push(filteredLeaderboard[0]); // 1st place
    if (filteredLeaderboard.length >= 3) top3.push(filteredLeaderboard[2]); // 3rd place

    if (top3.length === 0) return null;

    return (
      <div className="podium-wrapper">
        <div className="podium-container">
          {top3.map((group, index) => {
            // Determine actual rank based on position in our [2nd, 1st, 3rd] array
            let rank = 1;
            if (filteredLeaderboard.length >= 2 && index === 0) rank = 2;
            else if (filteredLeaderboard.length >= 1 && index === (filteredLeaderboard.length >= 2 ? 1 : 0)) rank = 1;
            else rank = 3;

            return (
              <div key={group.group_id || index} className={`podium-step rank-${rank}`}>
                <div className="podium-avatar-wrapper">
                  {group.group_profile ? (
                    <img src={getLocalUrl(group.group_profile)} alt="" className="podium-avatar" />
                  ) : (
                    <div className="podium-avatar-placeholder">{group.group_name.charAt(0)}</div>
                  )}
                  {rank === 1 && <Trophy size={24} className="podium-badge rank-gold" />}
                  {rank === 2 && <Medal size={20} className="podium-badge rank-silver" />}
                  {rank === 3 && <Medal size={20} className="podium-badge rank-bronze" />}
                </div>
                <span className="podium-name">{group.group_name}</span>
                <span className="podium-score">{group.total_score} pts</span>
                <div className="podium-block">
                  <span className="podium-rank-text">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="games-page animate-fade-in">
      <div className="games-hero">
        <div className="container text-center">
          <h1 className="premium-title mb-2">Camp <span className="gradient-text text-amber-500">Games</span></h1>
          <p className="premium-subtitle">Live Taliaa (طليعة) Leaderboard</p>
        </div>
      </div>

      <div className="container pb-12">
        <div className="gender-toggle-wrapper">
          <div className={`gender-toggle ${activeTab === 'GIRL' ? 'active-girl' : ''}`}>
            <div className="gender-toggle-slider"></div>
            <button 
              className={`gender-toggle-btn ${activeTab === 'BOY' ? 'active' : ''}`}
              onClick={() => setActiveTab('BOY')}
            >
              <Users size={18} />
              Boy Scouts
            </button>
            <button 
              className={`gender-toggle-btn ${activeTab === 'GIRL' ? 'active' : ''}`}
              onClick={() => setActiveTab('GIRL')}
            >
              <Flower2 size={18} />
              Girl Scouts
            </button>
          </div>
        </div>

        {renderPodium()}

        <div className="glass border-radius overflow-hidden shadow-xl leaderboard-container">
          <div className="table-responsive">
            <table className="leaderboard-table w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="th-rank text-center p-4">Rank</th>
                  <th className="th-patrol p-4 min-w-200">Taliaa (طليعة)</th>
                  {games.map(game => (
                    <th key={game.id} className={`th-game p-4 text-center whitespace-nowrap ${game.is_bonus ? 'th-bonus' : ''}`}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        {game.is_bonus && <span className="bonus-tag bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">BONUS</span>}
                        <span>{game.name}</span>
                      </div>
                    </th>
                  ))}
                  <th className="th-total p-4 text-center font-bold">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.filter(group => group.group_gender === activeTab).map((group, index) => (
                  <tr key={group.group_id} className={`tr-patrol ${index < 3 ? 'top-3-row' : ''} ${index === 0 ? 'first-place-row' : ''}`}>
                    <td data-label="Rank" className="td-rank text-center p-4 align-middle">
                      <div className="flex justify-center items-center h-full">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td data-label="Taliaa (طليعة)" className="td-patrol p-4 align-middle">
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
                      <td data-label={game.name} key={game.id} className={`td-score text-center p-4 font-medium align-middle ${game.is_bonus ? 'td-bonus' : ''}`}>
                        <span className={`score-badge ${game.is_bonus ? 'score-badge-bonus' : ''}`}>{group.scores[game.id] || '-'}</span>
                      </td>
                    ))}
                    
                    <td data-label="Total Score" className="td-total text-center p-4 font-bold text-lg align-middle bg-total">
                      <span className="total-badge">{group.total_score}</span>
                    </td>
                  </tr>
                ))}
                
                {leaderboard.filter(group => group.group_gender === activeTab).length === 0 && (
                  <tr>
                    <td colSpan={games.length + 3} className="text-center p-8 text-muted italic">
                      No scores recorded yet for this category. Let the games begin!
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
