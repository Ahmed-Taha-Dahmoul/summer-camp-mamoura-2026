import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChefHat, PenTool, Music, User as UserIcon, Star, Flag, Palette, Image as ImageIcon, Monitor, UploadCloud, Save, Bird, Moon, Mountain, Sun, Compass, Tent, UserPlus, Shield, Award, Zap, Gamepad2, ChevronRight, X } from 'lucide-react';
import MarioPartyTimeline from './MarioPartyTimeline';
import './Dashboard.css';

const ROLE_LABELS = {
  'SECOND_LEADER': 'مساعد عريف (Second Leader)',
  'WRITER': 'كاتب/مدون (Writer)',
  'CHEF': 'طباخ (Chef)',
  'SINGER': 'منشد (Singer)',
  'MEMBER': 'عضو (Member)'
};

const RoleIcon = ({ role }) => {
  switch(role) {
    case 'CHEF': return <ChefHat size={16} className="role-icon chef-icon" />;
    case 'WRITER': return <PenTool size={16} className="role-icon writer-icon" />;
    case 'SINGER': return <Music size={16} className="role-icon singer-icon" />;
    case 'SECOND_LEADER': return <Star size={16} className="role-icon leader-icon" />;
    case 'AMIID': return <Flag size={16} className="role-icon" style={{ color: '#eab308' }} />;
    default: return <UserIcon size={16} className="role-icon member-icon" />;
  }
};

function Dashboard({ hideHeader = false }) {
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCodes, setInviteCodes] = useState([]);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'codes', 'customization'

  // Profile edit states
  const [editDesc, setEditDesc] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [themeColor, setThemeColor] = useState('blue');
  const [avatarPreset, setAvatarPreset] = useState('tent');
  const [bannerPreset, setBannerPreset] = useState('forest');

  const navigate = useNavigate();

  const api = axios.create({
    baseURL: '/api/',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });

  const getBannerGradient = (preset) => {
    switch(preset) {
      case 'forest': return 'linear-gradient(135deg, #064e3b, #10b981)';
      case 'mountain': return 'linear-gradient(135deg, #1e293b, #94a3b8)';
      case 'space': return 'linear-gradient(135deg, #0f172a, #8b5cf6)';
      case 'fire': return 'linear-gradient(135deg, #7f1d1d, #f59e0b)';
      default: return 'linear-gradient(45deg, #1e293b, #3b82f6)';
    }
  };

  const renderAvatarPreset = (preset) => {
    switch(preset) {
      case 'eagle': return <Bird size={48} color="var(--text)" />;
      case 'wolf': return <Moon size={48} color="var(--text)" />;
      case 'bear': return <Mountain size={48} color="var(--text)" />;
      case 'lion': return <Sun size={48} color="var(--text)" />;
      case 'compass': return <Compass size={48} color="var(--text)" />;
      case 'tent': 
      default: return <Tent size={48} color="var(--text)" />;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await api.get('accounts/profile/');
      setProfile(profileRes.data);

      const groupsRes = await api.get('camp/groups/');
      setGroups(groupsRes.data);
      
      let userGroup = null;
      if (profileRes.data.role === 'AMIID') {
        userGroup = groupsRes.data.find(g => g.leader === profileRes.data.id);
      } else {
        userGroup = groupsRes.data.find(g => g.members && g.members.some(m => m.user.id === profileRes.data.id));
      }
      setMyGroup(userGroup);

      if (userGroup && profileRes.data.role === 'AMIID') {
        const codesRes = await api.get('camp/invite-codes/');
        setInviteCodes(codesRes.data);
        setEditDesc(userGroup.description || '');
        setThemeColor(userGroup.theme_color || 'blue');
        setAvatarPreset(userGroup.avatar_preset || 'tent');
        setBannerPreset(userGroup.banner_preset || 'forest');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('camp/groups/', { name: newGroupName });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateCode = async () => {
    try {
      await api.post('camp/invite-codes/', {});
      const codesRes = await api.get('camp/invite-codes/');
      setInviteCodes(codesRes.data);
    } catch (err) {
      console.error(err);
      alert('Error generating invite code');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this scout? Their account will be disabled.")) return;
    try {
      await api.post(`camp/groups/${myGroup.id}/remove_member/`, { user_id: userId });
      
      // refresh myGroup to show updated members
      const groupsRes = await api.get('camp/groups/');
      const updatedLeaderGroup = groupsRes.data.find(g => g.id === myGroup.id);
      setMyGroup(updatedLeaderGroup);
    } catch (err) {
      console.error(err);
      alert('Error removing member');
    }
  };

  const handleAssignRole = async (userId, newRole) => {
    try {
      await api.post(`camp/groups/${myGroup.id}/assign_role/`, { user_id: userId, role: newRole });
      
      // refresh myGroup
      const groupsRes = await api.get('camp/groups/');
      const updatedLeaderGroup = groupsRes.data.find(g => g.id === myGroup.id);
      setMyGroup(updatedLeaderGroup);
    } catch (err) {
      console.error(err);
      alert('Error assigning role');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (editDesc !== myGroup.description) formData.append('description', editDesc);
    if (themeColor !== myGroup.theme_color) formData.append('theme_color', themeColor);
    if (avatarPreset !== myGroup.avatar_preset) formData.append('avatar_preset', avatarPreset);
    if (bannerPreset !== myGroup.banner_preset) formData.append('banner_preset', bannerPreset);
    
    if (bannerFile) formData.append('banner', bannerFile);
    if (avatarFile) formData.append('profile_picture', avatarFile);

    try {
      await api.patch(`camp/groups/${myGroup.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Profile updated successfully!');
      fetchData();
      setBannerFile(null);
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    }
  };

  if (!profile) return <div className="container mt-4">Loading...</div>;

  return (
    <div className={`dashboard container animate-fade-in ${hideHeader ? 'pt-0' : ''}`}>
      {!hideHeader && (
        <header className="dashboard-header">
          <h1>Welcome, {profile.first_name || profile.username}!</h1>
          <p className="role-badge">{profile.role}</p>
        </header>
      )}

      {profile.role === 'LEADER' && (
        <>
          <section className="leader-dashboard glass p-6 border-radius mt-8">
            <h2>Scout Leader Dashboard</h2>
            <p className="text-muted mt-2">Welcome, Qaid! Administrative features will be available here soon.</p>
          </section>
          
          <div className="mt-8">
            <MarioPartyTimeline />
          </div>
        </>
      )}

      {profile.role === 'AMIID' && !myGroup && (
        <section className="create-group-section glass p-6 border-radius mt-8">
          <h2>Create Your Taliaa (طليعة)</h2>
          <form onSubmit={handleCreateGroup} className="flex gap-4 mt-4">
            <input 
              type="text" 
              placeholder="Taliaa Name (e.g. Eagles)" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
              className="p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="btn btn-primary">Create Taliaa (طليعة)</button>
          </form>
        </section>
      )}

      {profile.role === 'AMIID' && myGroup && (
        <section className="manage-group-section mt-8">
          <div className="flex justify-between align-center mb-4">
            <h2>Manage Group: <span className="text-primary">{myGroup.name}</span></h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/group/${myGroup.id}`)}
            >
              View Public Profile
            </button>
          </div>

          {/* Dashboard Tabs Navigation */}
          <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
            <button 
              className={`pb-2 px-4 font-bold text-lg ${activeTab === 'members' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('members')}
              style={{ background: 'transparent' }}
            >
              Taliaa (طليعة) Roster
            </button>
            <button 
              className={`pb-2 px-4 font-bold text-lg ${activeTab === 'codes' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('codes')}
              style={{ background: 'transparent' }}
            >
              Invite Codes
            </button>
            <button 
              className={`pb-2 px-4 font-bold text-lg ${activeTab === 'customization' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('customization')}
              style={{ background: 'transparent' }}
            >
              Profile Customization
            </button>
          </div>

          {activeTab === 'customization' && (
            <div className="glass p-6 border-radius mb-8 animate-fade-in" style={{ borderTop: `4px solid var(--theme-${themeColor}, var(--primary))` }}>
              <div className="flex align-center gap-3 mb-2">
                <Palette className="text-primary" size={24} />
                <h3 className="m-0 text-2xl">Advanced Taliaa (طليعة) Customization</h3>
              </div>
              <p className="text-muted text-sm mb-6">Build your Steam-like public profile. Choose a theme color, preset assets, or upload your own to stand out!</p>
              <div className="grid grid-cols-3 gap-8">
                
                {/* Left Column: Controls (col-span-2) */}
                <div className="lg-col-span-2">
                  <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                    
                    {/* Theme Selection */}
                    <div className="customization-card">
                      <div className="flex align-center gap-2 mb-4">
                        <Monitor size={18} className="text-muted" />
                        <label className="font-bold m-0 text-lg">Theme Aura</label>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { id: 'blue', label: 'Ocean' },
                          { id: 'red', label: 'Inferno' },
                          { id: 'green', label: 'Nature' },
                          { id: 'purple', label: 'Mystic' },
                          { id: 'gold', label: 'Royal' }
                        ].map(color => (
                          <div 
                            key={color.id}
                            onClick={() => setThemeColor(color.id)}
                            className="theme-selector-btn"
                            style={{ opacity: themeColor === color.id ? 1 : 0.6 }}
                          >
                            <div 
                              className="theme-selector-circle"
                              style={{ 
                                background: `linear-gradient(135deg, var(--theme-${color.id}, ${color.id}), rgba(0,0,0,0.2))`,
                                border: themeColor === color.id ? '2px solid var(--text-h)' : '2px solid transparent',
                                boxShadow: themeColor === color.id ? `0 0 15px var(--theme-${color.id}, ${color.id})` : 'none',
                                transform: themeColor === color.id ? 'scale(1.1)' : 'scale(1)'
                              }}
                            >
                              {themeColor === color.id && <Star size={20} color="white" />}
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'var(--text-h)' }}>{color.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assets Selection */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Avatar Section */}
                      <div className="customization-card flex flex-col">
                        <div className="flex align-center gap-2 mb-4">
                          <UserIcon size={18} className="text-muted" />
                          <label className="font-bold m-0 text-lg">Taliaa (طليعة) Avatar</label>
                        </div>
                        
                        <div className="flex-col gap-4 flex" style={{ flex: 1 }}>
                          <select 
                            value={avatarPreset} 
                            onChange={e => setAvatarPreset(e.target.value)}
                            className="premium-select cursor-pointer"
                          >
                            <option value="tent">⛺ Tent Base</option>
                            <option value="eagle">🦅 Eagle Eye</option>
                            <option value="wolf">🐺 Lone Wolf</option>
                            <option value="bear">🐻 Grizzly Bear</option>
                            <option value="lion">🦁 Lion King</option>
                            <option value="compass">🧭 Navigator</option>
                          </select>

                          <div className="upload-zone" onClick={() => document.getElementById('avatar-upload').click()}>
                            <UploadCloud size={28} className="text-muted mb-2" />
                            <span className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>Upload Custom Avatar</span>
                            <span className="text-xs text-muted mt-1">PNG, JPG up to 2MB</span>
                            <input 
                              id="avatar-upload"
                              type="file" 
                              onChange={e => setAvatarFile(e.target.files[0])} 
                              accept="image/*" 
                              style={{ display: 'none' }}
                            />
                            {avatarFile && <span className="mt-2 text-xs" style={{ color: 'var(--primary)' }}>Selected: {avatarFile.name}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Banner Section */}
                      <div className="customization-card flex flex-col">
                        <div className="flex align-center gap-2 mb-4">
                          <ImageIcon size={18} className="text-muted" />
                          <label className="font-bold m-0 text-lg">Profile Banner</label>
                        </div>
                        
                        <div className="flex-col gap-4 flex" style={{ flex: 1 }}>
                          <select 
                            value={bannerPreset} 
                            onChange={e => setBannerPreset(e.target.value)}
                            className="premium-select cursor-pointer"
                          >
                            <option value="forest">🌲 Mystic Forest</option>
                            <option value="mountain">⛰️ Snowy Mountain</option>
                            <option value="space">🌌 Deep Space</option>
                            <option value="fire">🔥 Roaring Fire</option>
                          </select>

                          <div className="upload-zone" onClick={() => document.getElementById('banner-upload').click()}>
                            <UploadCloud size={28} className="text-muted mb-2" />
                            <span className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>Upload Custom Banner</span>
                            <span className="text-xs text-muted mt-1">Recommended 1200x300px</span>
                            <input 
                              id="banner-upload"
                              type="file" 
                              onChange={e => setBannerFile(e.target.files[0])} 
                              accept="image/*" 
                              style={{ display: 'none' }}
                            />
                            {bannerFile && <span className="mt-2 text-xs" style={{ color: 'var(--primary)' }}>Selected: {bannerFile.name}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="customization-card">
                      <div className="flex align-center gap-2 mb-4">
                        <PenTool size={18} className="text-muted" />
                        <label className="font-bold m-0 text-lg">Taliaa (طليعة) Legend</label>
                      </div>
                      <textarea 
                        value={editDesc} 
                        onChange={e => setEditDesc(e.target.value)}
                        className="premium-textarea"
                        rows={4}
                        style={{ resize: 'vertical' }}
                        placeholder="Tell the grand story of your taliaa... Who are you? What is your motto?"
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary self-start px-8 py-3 flex align-center gap-2 font-bold text-lg" style={{ boxShadow: `0 4px 20px rgba(0,0,0,0.1)`, transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <Save size={20} />
                      Save Customization
                    </button>
                  </form>
                </div>

                {/* Right Column: Live Preview */}
                <div className="flex flex-col gap-4">
                  <div className="flex align-center gap-2 mb-2">
                    <Monitor size={18} className="text-muted" />
                    <h4 className="m-0 text-lg font-bold text-muted">Live Preview</h4>
                  </div>
                  
                  <div className="live-preview-card" style={{ 
                    border: `1px solid var(--theme-${themeColor}, var(--border))`,
                    boxShadow: `var(--shadow)`
                  }}>
                    {/* Banner Area */}
                    <div className="preview-banner" style={{ background: bannerFile ? `url(${URL.createObjectURL(bannerFile)}) center/cover` : getBannerGradient(bannerPreset) }}>
                      <div className="preview-banner-overlay"></div>
                    </div>
                    
                    {/* Avatar Area */}
                    <div className="preview-content">
                      <div className="preview-avatar" style={{ borderColor: `var(--theme-${themeColor}, var(--bg))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {avatarFile ? (
                          <img src={URL.createObjectURL(avatarFile)} alt="Avatar" />
                        ) : (
                          renderAvatarPreset(avatarPreset)
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="m-0 text-2xl font-bold flex align-center gap-2" style={{ color: 'var(--text-h)', wordBreak: 'break-word' }}>
                          {myGroup?.group_name || 'My Awesome Taliaa (طليعة)'}
                          {themeColor === 'gold' && <Star size={20} color="#eab308" style={{ flexShrink: 0 }} />}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                           <span className="level-badge" style={{ color: `var(--theme-${themeColor}, var(--primary))` }}>Level {myGroup?.level || 1}</span>
                           <span className="member-badge" style={{ color: `var(--theme-${themeColor}, var(--primary))` }}>{myGroup?.users?.length || 1} Member{myGroup?.users?.length !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{editDesc || 'Tell the grand story of your taliaa... Who are you? What is your motto?'}"
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t" style={{ borderTopColor: 'var(--border)' }}>
                        <div className="flex justify-between text-xs mb-1 font-bold">
                          <span style={{ color: `var(--theme-${themeColor}, var(--primary))` }}>Taliaa (طليعة) XP</span>
                          <span className="text-muted">{(myGroup?.total_xp || 0) % 1000} / 1000 XP</span>
                        </div>
                        <div className="xp-bar-container">
                          <div className="xp-bar-fill" style={{ width: `${((myGroup?.total_xp || 0) % 1000) / 10}%`, background: `var(--theme-${themeColor}, var(--primary))` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'codes' && (
            <div className="glass p-6 border-radius animate-fade-in">
              <div className="invite-codes">
                <h3>Invite Codes</h3>
                <p className="text-muted">Share these codes with your scouts so they can register and join your group automatically.</p>
                
                <div className="flex align-center gap-4 mt-4">
                  <button 
                    onClick={handleGenerateCode} 
                    className="btn btn-secondary"
                    disabled={inviteCodes.length >= 8}
                  >
                    Generate New Code
                  </button>
                  <span className="text-sm font-bold" style={{ color: inviteCodes.length >= 8 ? '#dc2626' : 'inherit' }}>
                    Generated: {inviteCodes.length} / 8
                  </span>
                </div>
                
                <div className="codes-list mt-4">
                  {inviteCodes.map(codeObj => (
                    <div key={codeObj.id} className={`code-item ${codeObj.is_used ? 'used' : 'active'}`}>
                      <span className="code-text font-mono font-bold text-lg">{codeObj.code}</span>
                      <span className="status ml-4">
                        {codeObj.is_used ? '❌ Used' : '✅ Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="glass p-6 border-radius animate-fade-in">
              <div className="members-list">
                <h3>Taliaa (طليعة) Members</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  
                  {/* Render Amiid (Group Creator) */}
                  {myGroup.amiid_details && (
                    <div className="glass p-4 flex flex-col justify-between border-radius gap-4" style={{ borderColor: '#eab308', borderWidth: '2px' }}>
                      <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                             {myGroup.amiid_details.profile_picture ? (
                                <img src={myGroup.amiid_details.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                             ) : (
                                <span className="font-bold text-lg">{myGroup.amiid_details.first_name?.[0] || myGroup.amiid_details.username[0]}</span>
                             )}
                          </div>
                          <div>
                            <p className="font-bold">{myGroup.amiid_details.first_name || myGroup.amiid_details.username} {myGroup.amiid_details.last_name}</p>
                            <p className="text-muted text-sm">@{myGroup.amiid_details.username}</p>
                          </div>
                        </div>
                        <div className="role-display flex align-center gap-2">
                          <RoleIcon role="AMIID" />
                          <span className="text-sm font-bold" style={{ color: '#eab308' }}>
                            {myGroup.amiid_details.gender === 'GIRL' ? 'عميدة (Amiida)' : 'عميد (Amiid)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {myGroup.members && myGroup.members.length > 0 && (
                    myGroup.members.map(member => (
                      <div key={member.id} className="glass p-4 flex flex-col justify-between border-radius gap-4">
                        <div className="flex justify-between align-center">
                          <div className="flex align-center gap-3">
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               {member.user.profile_picture ? (
                                  <img src={member.user.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                               ) : (
                                  <span className="font-bold text-lg">{member.user.first_name?.[0] || member.user.username[0]}</span>
                               )}
                            </div>
                            <div>
                              <p className="font-bold">{member.user.first_name} {member.user.last_name}</p>
                              <p className="text-muted text-sm">@{member.user.username}</p>
                            </div>
                          </div>
                          <div className="role-display flex align-center gap-2">
                            <RoleIcon role={member.group_role} />
                            <span className="text-sm font-bold">{ROLE_LABELS[member.group_role]}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between align-center mt-2 pt-2 border-t border-gray-200">
                          <select 
                            value={member.group_role} 
                            onChange={(e) => handleAssignRole(member.user.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded text-sm bg-gray-800 text-white"
                          >
                            {Object.entries(ROLE_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="btn btn-secondary text-sm"
                            style={{ backgroundColor: '#dc2626', padding: '0.25rem 0.5rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {(!myGroup.members || myGroup.members.length === 0) && (
                    <p className="text-muted col-span-2">No other members yet. Share your invite codes!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {profile.role === 'SCOUT' && (
        <section className="scout-dashboard mt-8">
          {myGroup ? (
            <div className="glass p-6 border-radius">
              <div className="flex justify-between align-center mb-4">
                <div>
                  <h2>My Group: <span className="text-primary">{myGroup.name}</span></h2>
                  <p className="text-muted mt-2">Leader: {myGroup.leader_name}</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate(`/group/${myGroup.id}`)}
                >
                  View Public Profile
                </button>
              </div>
              
              {/* Find the scout's own role */}
              {(() => {
                const myProfile = myGroup.members.find(m => m.user.id === profile.id);
                if (!myProfile) return null;
                return (
                  <div className="my-role-card mt-6 p-4 border border-gray-300 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="mb-2">My Assigned Role</h3>
                    <div className="role-display flex align-center gap-2">
                      <RoleIcon role={myProfile.group_role} />
                      <span className="text-lg font-bold text-primary">{ROLE_LABELS[myProfile.group_role]}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="members-list mt-8">
                <h3>Taliaa (طليعة) Members</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Render Amiid (Group Creator) */}
                  {myGroup.amiid_details && (
                    <div className="glass p-4 flex flex-col justify-between border-radius gap-4" style={{ borderColor: '#eab308', borderWidth: '2px' }}>
                      <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                             {myGroup.amiid_details.profile_picture ? (
                                <img src={myGroup.amiid_details.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                             ) : (
                                <span className="font-bold text-lg">{myGroup.amiid_details.first_name?.[0] || myGroup.amiid_details.username[0]}</span>
                             )}
                          </div>
                          <div>
                            <p className="font-bold">{myGroup.amiid_details.first_name || myGroup.amiid_details.username} {myGroup.amiid_details.last_name}</p>
                            <p className="text-muted text-sm">@{myGroup.amiid_details.username}</p>
                          </div>
                        </div>
                        <div className="role-display flex align-center gap-2">
                          <RoleIcon role="AMIID" />
                          <span className="text-sm font-bold" style={{ color: '#eab308' }}>
                            {myGroup.amiid_details.gender === 'GIRL' ? 'عميدة (Amiida)' : 'عميد (Amiid)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {myGroup.members.map(member => (
                    <div key={member.id} className="glass p-4 flex flex-col justify-between border-radius gap-4">
                      <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {member.user.profile_picture ? (
                                <img src={member.user.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                             ) : (
                                <span className="font-bold text-lg">{member.user.first_name?.[0] || member.user.username[0]}</span>
                             )}
                          </div>
                          <div>
                            <p className="font-bold">{member.user.first_name} {member.user.last_name}</p>
                            <p className="text-muted text-sm">@{member.user.username}</p>
                          </div>
                        </div>
                        <div className="role-display flex align-center gap-2">
                          <RoleIcon role={member.group_role} />
                          <span className="text-sm font-bold">{ROLE_LABELS[member.group_role]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass p-6 border-radius">
              <h2>Welcome to the Paths of Happiness summer camp!</h2>
              <p className="text-muted mt-4">You are not assigned to a group yet. Please use a valid invite code from your leader to join one.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Dashboard;
