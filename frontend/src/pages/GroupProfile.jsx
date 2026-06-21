import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Flame, Activity, Compass, Tent, Star, ChefHat, PenTool, Music, User as UserIcon, Flag, Moon, Mountain, Bird, Sun } from 'lucide-react';
import './GroupProfile.css';

const ROLE_LABELS = {
  'SECOND_LEADER': 'مساعد عريف (Second Leader)',
  'WRITER': 'كاتب/مدون (Writer)',
  'CHEF': 'طباخ (Chef)',
  'SINGER': 'منشد (Singer)',
  'MEMBER': 'عضو (Member)'
};

const RoleIcon = ({ role, size = 16 }) => {
  switch(role) {
    case 'CHEF': return <ChefHat size={size} />;
    case 'WRITER': return <PenTool size={size} />;
    case 'SINGER': return <Music size={size} />;
    case 'SECOND_LEADER': return <Star size={size} />;
    case 'ARIF': return <Flag size={size} />;
    default: return <UserIcon size={size} />;
  }
};

function GroupProfile() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/camp/groups/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setGroup(response.data);
      } catch (err) {
        setError('Failed to load patrol profile. It might not exist or you lack permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  if (loading) return <div className="container mt-8 text-center">Loading Patrol Database...</div>;
  if (error) return <div className="container mt-8 text-center text-red-500">{error}</div>;
  if (!group) return null;

  const bannerUrl = group.banner ? (group.banner.startsWith('http') ? group.banner : `http://127.0.0.1:8000${group.banner}`) : null;
  const avatarUrl = group.profile_picture ? (group.profile_picture.startsWith('http') ? group.profile_picture : `http://127.0.0.1:8000${group.profile_picture}`) : null;

  const renderAvatar = (preset) => {
    switch(preset) {
      case 'eagle': return <Bird size={64} color="#e2e8f0" />;
      case 'wolf': return <Moon size={64} color="#e2e8f0" />;
      case 'bear': return <Mountain size={64} color="#e2e8f0" />;
      case 'lion': return <Sun size={64} color="#e2e8f0" />;
      case 'compass': return <Compass size={64} color="#e2e8f0" />;
      case 'tent': 
      default: return <Tent size={64} color="#e2e8f0" />;
    }
  };

  const getBannerGradient = (preset) => {
    switch(preset) {
      case 'forest': return 'linear-gradient(135deg, #064e3b, #10b981)';
      case 'mountain': return 'linear-gradient(135deg, #1e293b, #94a3b8)';
      case 'space': return 'linear-gradient(135deg, #0f172a, #8b5cf6)';
      case 'fire': return 'linear-gradient(135deg, #7f1d1d, #f59e0b)';
      default: return 'linear-gradient(45deg, #1e293b, #3b82f6)';
    }
  };

  const getThemeColorHex = (color) => {
    switch(color) {
      case 'red': return '#ef4444';
      case 'green': return '#10b981';
      case 'purple': return '#8b5cf6';
      case 'gold': return '#eab308';
      case 'blue':
      default: return '#3b82f6';
    }
  };

  const themeHex = getThemeColorHex(group.theme_color);

  return (
    <div 
      className="group-profile animate-fade-in"
      style={{ '--primary-theme-color': themeHex }}
    >
      <div 
        className="hero-banner"
        style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : getBannerGradient(group.banner_preset) }}
      >
        <div className="hero-content container">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Group Avatar" className="profile-avatar" style={{ borderColor: themeHex }} />
          ) : (
            <div className="profile-avatar flex justify-center align-center" style={{ borderColor: themeHex, background: 'rgba(0,0,0,0.5)' }}>
              {renderAvatar(group.avatar_preset)}
            </div>
          )}
          
          <div className="hero-text">
            <h1>{group.name}</h1>
            {group.arif_details && (
              <div className="arif-name">
                <Flag size={18} />
                Led by {group.arif_details.first_name || group.arif_details.username}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container profile-body">
        {group.description && (
          <div className="glass-card mb-8">
            <h3 className="mb-2">Patrol Legend</h3>
            <p className="text-muted leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{group.description}</p>
          </div>
        )}

        <div className="glass-card mb-8">
          <h3>Achievements & Badges</h3>
          <p className="text-muted text-sm mt-1">Unlock these badges through camp activities!</p>
          <div className="badges-grid">
            <div className="badge-item badge-fire">
              <div className="badge-icon-wrapper"><Flame size={32} /></div>
              <span className="badge-title">First Campfire</span>
            </div>
            <div className="badge-item badge-knot">
              <div className="badge-icon-wrapper"><Activity size={32} /></div>
              <span className="badge-title">Knot Master</span>
            </div>
            <div className="badge-item badge-compass">
              <div className="badge-icon-wrapper"><Compass size={32} /></div>
              <span className="badge-title">Pathfinder</span>
            </div>
            <div className="badge-item badge-tent">
              <div className="badge-icon-wrapper"><Tent size={32} /></div>
              <span className="badge-title">Survivalist</span>
            </div>
            <div className="badge-item badge-star">
              <div className="badge-icon-wrapper"><Star size={32} /></div>
              <span className="badge-title">Star Patrol</span>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3>Patrol Roster</h3>
          <div className="roster-grid">
            {/* Arif */}
            {group.arif_details && (
              <div className="roster-card" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                <div className="roster-avatar" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                  {group.arif_details.first_name?.[0] || group.arif_details.username[0]}
                </div>
                <div>
                  <div className="font-bold">{group.arif_details.first_name || group.arif_details.username} {group.arif_details.last_name}</div>
                  <div className="text-xs font-bold" style={{ color: '#eab308' }}>عريف (Arif)</div>
                </div>
              </div>
            )}

            {/* Members */}
            {group.members && group.members.map(member => (
              <div key={member.id} className="roster-card">
                <div className="roster-avatar">
                  {member.user.first_name?.[0] || member.user.username[0]}
                </div>
                <div>
                  <div className="font-bold">{member.user.first_name || member.user.username} {member.user.last_name}</div>
                  <div className="text-xs text-primary flex align-center gap-1">
                    <RoleIcon role={member.group_role} size={12} />
                    {ROLE_LABELS[member.group_role]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GroupProfile;
