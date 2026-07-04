import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Save, User as UserIcon, LogOut, ChevronRight } from 'lucide-react';
import './UserProfile.css';

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/accounts/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone_number: res.data.phone_number || '',
        bio: res.data.bio || ''
      });
      if (res.data.profile_picture) {
        setPreviewImage(res.data.profile_picture ? res.data.profile_picture.replace(/^https?:\/\/[^\/]+/, '') : '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('email', formData.email);
    data.append('phone_number', formData.phone_number);
    data.append('bio', formData.bio);
    if (profilePicture) {
      data.append('profile_picture', profilePicture);
    }

    try {
      await axios.patch(`/api/accounts/profile/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err) {
      console.error(err.response?.data || err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to update profile: ' + errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  if (loading) return <div className="container mt-8 text-center">Loading Profile...</div>;
  if (!profile) return null;

  return (
    <div className="user-profile-page animate-fade-in">
      <div className="profile-header-card">
        <div className="image-wrapper">
          {previewImage ? (
            <img src={previewImage} alt="Profile" className="profile-pic-preview" />
          ) : (
            <div className="profile-pic-placeholder">
              <UserIcon size={48} />
            </div>
          )}
          <label htmlFor="profile-upload" className="image-upload-btn">
            <Camera size={18} />
          </label>
          <input 
            id="profile-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
        </div>
        
        <h1 className="profile-name">{profile.first_name || profile.username} {profile.last_name}</h1>
        <p className="profile-username">@{profile.username}</p>
        
        <div className="mt-2">
          <span className="role-badge">{profile.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="settings-section">
          <h3 className="settings-section-title">Account Details</h3>
          <div className="settings-group">
            <div className="settings-row">
              <label>First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" />
            </div>
            <div className="settings-divider"></div>
            <div className="settings-row">
              <label>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" />
            </div>
            <div className="settings-divider"></div>
            <div className="settings-row">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" />
            </div>
            <div className="settings-divider"></div>
            <div className="settings-row">
              <label>Phone</label>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+216..." />
            </div>
          </div>
        </div>

        <div className="settings-section mt-6">
          <h3 className="settings-section-title">About Me</h3>
          <div className="settings-group">
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className="settings-textarea"
              rows={4}
              placeholder="Tell everyone a little bit about yourself..."
            />
          </div>
        </div>

        <div className="settings-section mt-6 px-4">
          <button type="submit" className="btn btn-secondary w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }}>
            <Save size={20} />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      <div className="settings-section mt-8">
        <div className="settings-group">
          <button type="button" className="settings-row action-row" onClick={handleLogout}>
            <div className="logout-content">
              <LogOut size={20} className="text-danger" />
              <span className="text-danger font-bold">Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
