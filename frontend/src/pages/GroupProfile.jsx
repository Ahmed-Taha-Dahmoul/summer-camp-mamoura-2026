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
    case 'AMIID': return <Flag size={size} />;
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
        const response = await axios.get(`/api/camp/groups/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setGroup(response.data);
      } catch (err) {
        setError('Failed to load Taliaa (طليعة) profile. It might not exist or you lack permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  if (loading) return <div className="container mt-8 text-center">Loading Taliaa (طليعة) Database...</div>;
  if (error) return <div className="container mt-8 text-center text-red-500">{error}</div>;
  if (!group) return null;

  const bannerUrl = group.banner ? (group.banner ? group.banner.replace(/^https?:\/\/[^\/]+/, '') : '') : null;
  const avatarUrl = group.profile_picture ? (group.profile_picture ? group.profile_picture.replace(/^https?:\/\/[^\/]+/, '') : '') : null;

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
        <div className="hero-banner-overlay"></div>
      </div>
      
      <div className="hero-content container">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Group Avatar" className="profile-avatar" style={{ borderColor: `var(--primary-theme-color, var(--bg))` }} />
        ) : (
          <div className="profile-avatar flex justify-center align-center" style={{ borderColor: `var(--primary-theme-color, var(--bg))` }}>
            {renderAvatar(group.avatar_preset)}
          </div>
        )}
        
        <div className="hero-text">
          <h1>{group.name}</h1>
          {group.amiid_details && (
            <div className="amiid-name">
              <Flag size={18} />
              Led by {group.amiid_details.first_name || group.amiid_details.username}
            </div>
          )}
        </div>
      </div>

      <div className="container profile-body">
        <div className="glass-card mb-8">
          <h3>Taliaa (طليعة) XP & Level</h3>
          <div className="flex justify-between text-sm mb-2 font-bold">
            <span style={{ color: `var(--primary-theme-color, var(--primary))` }}>Level {group.level || 1}</span>
            <span className="text-muted">{(group.total_xp || 0) % 1000} / 1000 XP</span>
          </div>
          <div className="xp-bar-container" style={{ height: '0.75rem', background: 'var(--code-bg)', borderRadius: '999px', overflow: 'hidden' }}>
            <div className="xp-bar-fill" style={{ width: `${((group.total_xp || 0) % 1000) / 10}%`, height: '100%', background: `var(--primary-theme-color, var(--primary))`, transition: 'width 1s ease-out' }}></div>
          </div>
        </div>

        {group.description && (
          <div className="glass-card mb-8">
            <h3 className="mb-2">Taliaa (طليعة) Legend</h3>
            <p className="text-muted leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{group.description}</p>
          </div>
        )}

        <div className="glass-card mb-8">
          <h3>Achievements & Badges</h3>
          <p className="text-muted text-sm mt-1">Unlock these badges through camp activities!</p>
          <div className="badges-grid">
            {[
              { id: 1, name: 'First Campfire', icon: Flame, colorClass: 'badge-fire' },
              { id: 2, name: 'Knot Master', icon: Activity, colorClass: 'badge-knot' },
              { id: 3, name: 'Pathfinder', icon: Compass, colorClass: 'badge-compass' },
              { id: 4, name: 'Survivalist', icon: Tent, colorClass: 'badge-tent' },
              { id: 5, name: 'Star Taliaa (طليعة)', icon: Star, colorClass: 'badge-star' }
            ].map(badge => {
              const isUnlocked = group.earned_badges?.some(eb => eb.badge.name === badge.name);
              const Icon = badge.icon;
              return (
                <div key={badge.id} className={`badge-item ${badge.colorClass}`} style={{ filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.5)' }}>
                  <div className="badge-icon-wrapper"><Icon size={32} /></div>
                  <span className="badge-title">{badge.name}</span>
                  {!isUnlocked && <div style={{ position: 'absolute', top: '10px', right: '10px' }}>🔒</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card">
          <h3>Taliaa (طليعة) Roster</h3>
          <div className="roster-grid">
            {/* Amiid */}
            {group.amiid_details && (
              <div className="roster-card" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                <div className="roster-avatar" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', overflow: 'hidden' }}>
                  {group.amiid_details.profile_picture ? (
                    <img 
                      src={group.amiid_details.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} 
                      alt={group.amiid_details.username} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    group.amiid_details.first_name?.[0] || group.amiid_details.username[0]
                  )}
                </div>
                <div>
                  <div className="font-bold">{group.amiid_details.first_name || group.amiid_details.username} {group.amiid_details.last_name}</div>
                  <div className="text-xs font-bold" style={{ color: '#eab308' }}>
                    {group.amiid_details.gender === 'GIRL' ? 'عميدة (Amiida)' : 'عميد (Amiid)'}
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {group.members && group.members.map(member => (
              <div key={member.id} className="roster-card">
                <div className="roster-avatar" style={{ overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  {member.user.profile_picture ? (
                    <img 
                      src={member.user.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} 
                      alt={member.user.username} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    member.user.first_name?.[0] || member.user.username[0]
                  )}
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
