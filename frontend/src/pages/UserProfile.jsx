import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Save, User as UserIcon } from 'lucide-react';
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
      const res = await axios.get('http://127.0.0.1:8000/api/accounts/profile/', {
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
        setPreviewImage(res.data.profile_picture.startsWith('http') ? res.data.profile_picture : `http://127.0.0.1:8000${res.data.profile_picture}`);
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
      await axios.patch('http://127.0.0.1:8000/api/accounts/profile/', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Profile updated successfully!');
      // Force reload to update navbar
      window.location.reload();
    } catch (err) {
      console.error(err.response?.data || err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to update profile: ' + errorMsg);
    }
  };

  if (loading) return <div className="container mt-8 text-center">Loading Profile...</div>;
  if (!profile) return null;

  return (
    <div className="container user-profile-page animate-fade-in">
      <div className="profile-header glass mb-8">
        <div className="profile-image-section">
          <div className="image-wrapper">
            {previewImage ? (
              <img src={previewImage} alt="Profile Preview" className="profile-pic-preview" />
            ) : (
              <div className="profile-pic-placeholder">
                <UserIcon size={64} />
              </div>
            )}
            <label htmlFor="profile-upload" className="image-upload-btn">
              <Camera size={16} />
              <span>Change</span>
            </label>
            <input 
              id="profile-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>
        <div className="profile-title-section">
          <h1>{profile.first_name || profile.username} {profile.last_name}</h1>
          <div className="badges-row">
            <span className="role-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {profile.role}
            </span>
            <span className="username-badge text-muted">@{profile.username}</span>
          </div>
        </div>
      </div>

      <div className="profile-body glass p-8 border-radius">
        <h2 className="mb-6">Personal Information</h2>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange} 
                className="custom-input"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                className="custom-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="custom-input"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                name="phone_number" 
                value={formData.phone_number} 
                onChange={handleChange} 
                placeholder="+1 234 567 890"
                className="custom-input"
              />
            </div>
          </div>

          <div className="form-group mb-8">
            <label>About Me (Bio)</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className="custom-input"
              rows={4}
              placeholder="Tell us a little bit about yourself, your scouting journey, and your hobbies..."
            />
          </div>

          <button type="submit" className="btn btn-secondary flex align-center gap-2">
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;
