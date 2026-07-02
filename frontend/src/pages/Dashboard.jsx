import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChefHat, PenTool, Music, User as UserIcon, Star, Flag } from 'lucide-react';
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
    case 'ARIF': return <Flag size={16} className="role-icon" style={{ color: '#eab308' }} />;
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
      if (profileRes.data.role === 'ARIF') {
        userGroup = groupsRes.data.find(g => g.leader === profileRes.data.id);
      } else {
        userGroup = groupsRes.data.find(g => g.members && g.members.some(m => m.user.id === profileRes.data.id));
      }
      setMyGroup(userGroup);

      if (userGroup && profileRes.data.role === 'ARIF') {
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
        <section className="leader-dashboard glass p-6 border-radius mt-8">
          <h2>Scout Leader Dashboard</h2>
          <p className="text-muted mt-2">Welcome, Qaid! Administrative features will be available here soon.</p>
        </section>
      )}

      {profile.role === 'ARIF' && !myGroup && (
        <section className="create-group-section glass p-6 border-radius mt-8">
          <h2>Create Your Patrol</h2>
          <form onSubmit={handleCreateGroup} className="flex gap-4 mt-4">
            <input 
              type="text" 
              placeholder="Patrol Name (e.g. Eagles)" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
              className="p-2 border border-gray-300 rounded"
            />
            <button type="submit" className="btn btn-primary">Create Patrol</button>
          </form>
        </section>
      )}

      {profile.role === 'ARIF' && myGroup && (
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
              Patrol Roster
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
            <div className="glass p-6 border-radius mb-8 animate-fade-in">
              <h3>Advanced Patrol Customization</h3>
              <p className="text-muted text-sm mb-6">Build your Steam-like public profile. Choose a theme color, preset assets, or upload your own!</p>
              
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                <div className="form-group p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <label className="font-bold mb-2 block">Theme Aura (Color)</label>
                  <div className="flex gap-4">
                    {['blue', 'red', 'green', 'purple', 'gold'].map(color => (
                      <div 
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`cursor-pointer rounded-full w-10 h-10 flex align-center justify-center`}
                        style={{ 
                          backgroundColor: `var(--theme-${color}, ${color})`,
                          border: themeColor === color ? '3px solid white' : '2px solid transparent',
                          boxShadow: themeColor === color ? `0 0 15px var(--theme-${color}, ${color})` : 'none'
                        }}
                      >
                        {themeColor === color && <span className="text-white">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="form-group p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <label className="font-bold mb-2 block">Prebuilt Avatar</label>
                    <select 
                      value={avatarPreset} 
                      onChange={e => setAvatarPreset(e.target.value)}
                      className="p-2 w-full border border-gray-600 rounded bg-gray-800 text-white mb-4"
                    >
                      <option value="tent">Tent Base</option>
                      <option value="eagle">Eagle Eye</option>
                      <option value="wolf">Lone Wolf</option>
                      <option value="bear">Grizzly Bear</option>
                      <option value="lion">Lion King</option>
                      <option value="compass">Navigator</option>
                    </select>
                    <label className="text-sm text-muted block mb-1">Or upload custom Avatar (Overrides preset):</label>
                    <input type="file" onChange={e => setAvatarFile(e.target.files[0])} accept="image/*" />
                  </div>

                  <div className="form-group p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <label className="font-bold mb-2 block">Prebuilt Banner</label>
                    <select 
                      value={bannerPreset} 
                      onChange={e => setBannerPreset(e.target.value)}
                      className="p-2 w-full border border-gray-600 rounded bg-gray-800 text-white mb-4"
                    >
                      <option value="forest">Mystic Forest</option>
                      <option value="mountain">Snowy Mountain</option>
                      <option value="space">Deep Space</option>
                      <option value="fire">Roaring Fire</option>
                    </select>
                    <label className="text-sm text-muted block mb-1">Or upload custom Banner (Overrides preset):</label>
                    <input type="file" onChange={e => setBannerFile(e.target.files[0])} accept="image/*" />
                  </div>
                </div>

                <div className="form-group p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <label className="font-bold mb-2 block">Patrol Legend (Description)</label>
                  <textarea 
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)}
                    className="p-3 w-full border border-gray-600 rounded bg-gray-800 text-white"
                    rows={4}
                    placeholder="Tell the grand story of your patrol..."
                  />
                </div>
                
                <button type="submit" className="btn btn-secondary self-start px-8">Save Customization</button>
              </form>
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
                <h3>Patrol Members</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  
                  {/* Render Arif (Group Creator) */}
                  {myGroup.arif_details && (
                    <div className="glass p-4 flex flex-col justify-between border-radius gap-4" style={{ borderColor: '#eab308', borderWidth: '2px' }}>
                      <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                             {myGroup.arif_details.profile_picture ? (
                                <img src={myGroup.arif_details.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                             ) : (
                                <span className="font-bold text-lg">{myGroup.arif_details.first_name?.[0] || myGroup.arif_details.username[0]}</span>
                             )}
                          </div>
                          <div>
                            <p className="font-bold">{myGroup.arif_details.first_name || myGroup.arif_details.username} {myGroup.arif_details.last_name}</p>
                            <p className="text-muted text-sm">@{myGroup.arif_details.username}</p>
                          </div>
                        </div>
                        <div className="role-display flex align-center gap-2">
                          <RoleIcon role="ARIF" />
                          <span className="text-sm font-bold" style={{ color: '#eab308' }}>عريف (Arif)</span>
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
                <h3>Patrol Members</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Render Arif (Group Creator) */}
                  {myGroup.arif_details && (
                    <div className="glass p-4 flex flex-col justify-between border-radius gap-4" style={{ borderColor: '#eab308', borderWidth: '2px' }}>
                      <div className="flex justify-between align-center">
                        <div className="flex align-center gap-3">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                             {myGroup.arif_details.profile_picture ? (
                                <img src={myGroup.arif_details.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} alt="..." style={{width:'100%', height:'100%', objectFit:'cover'}} />
                             ) : (
                                <span className="font-bold text-lg">{myGroup.arif_details.first_name?.[0] || myGroup.arif_details.username[0]}</span>
                             )}
                          </div>
                          <div>
                            <p className="font-bold">{myGroup.arif_details.first_name || myGroup.arif_details.username} {myGroup.arif_details.last_name}</p>
                            <p className="text-muted text-sm">@{myGroup.arif_details.username}</p>
                          </div>
                        </div>
                        <div className="role-display flex align-center gap-2">
                          <RoleIcon role="ARIF" />
                          <span className="text-sm font-bold" style={{ color: '#eab308' }}>عريف (Arif)</span>
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
