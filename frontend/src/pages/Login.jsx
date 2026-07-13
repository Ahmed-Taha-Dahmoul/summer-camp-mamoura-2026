import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [isLogin, setIsLogin] = useState('login'); // 'login', 'register_leader', 'register_scout'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    invite_code: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const normalizedUsername = formData.username.toLowerCase().trim();
      const normalizedInviteCode = formData.invite_code.toUpperCase().trim();

      if (isLogin === 'login') {
        const response = await axios.post(`/api/accounts/login/`, {
          username: normalizedUsername,
          password: formData.password
        });
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        navigate('/dashboard');
      } else {
        let selectedRole = 'SCOUT';
        if (isLogin === 'register_leader') selectedRole = 'LEADER';

        const payload = {
          ...formData,
          username: normalizedUsername,
          invite_code: normalizedInviteCode,
          role: selectedRole
        };
        await axios.post(`/api/accounts/register/`, payload);
        // auto login after register
        const loginRes = await axios.post(`/api/accounts/login/`, {
          username: normalizedUsername,
          password: formData.password
        });
        localStorage.setItem('access_token', loginRes.data.access);
        localStorage.setItem('refresh_token', loginRes.data.refresh);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data) {
        const errors = Object.values(err.response.data).flat();
        setError(errors.join(', '));
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-container container animate-fade-in">
      <div className="login-card glass">
        <div className="login-tabs">
          <button 
            className={`tab ${isLogin === 'login' ? 'active' : ''}`} 
            onClick={() => setIsLogin('login')}
          >
            Login
          </button>
          <button 
            className={`tab ${isLogin === 'register_scout' ? 'active' : ''}`} 
            onClick={() => setIsLogin('register_scout')}
          >
            Register (Amiid (عميد) / Amiida (عميدة) / Scout)
          </button>
          <button 
            className={`tab ${isLogin === 'register_leader' ? 'active' : ''}`} 
            onClick={() => setIsLogin('register_leader')}
          >
            Register (Scout Leader)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>

          {isLogin !== 'login' && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
              </div>
            </>
          )}

          {isLogin !== 'login' && (
            <div className="form-group">
              <label>
                {isLogin === 'register_scout' ? 'Amiid (عميد) / Amiida (عميدة) / Scout Invite Code' : 'Leader Invite Code'}
              </label>
              <input type="text" name="invite_code" value={formData.invite_code} onChange={handleChange} required />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4">
            {isLogin === 'login' ? 'Login' : 
             isLogin === 'register_scout' ? 'Register (Amiid (عميد) / Amiida (عميدة) / Scout)' : 'Register as Scout Leader'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
