import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, AlertCircle, RefreshCw, X, Plus } from 'lucide-react';
import './Instantane.css';

const EMOJIS = ['❤️', '🔥', '😂', '😮'];

function Instantane() {
  const navigate = useNavigate();
  const [hasPosted, setHasPosted] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  
  // View states: 'grid', 'camera', 'viewer'
  const [viewMode, setViewMode] = useState('grid');
  
  // Story state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllCaughtUp, setShowAllCaughtUp] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const token = localStorage.getItem('access_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchInstantanes();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1440 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const fetchInstantanes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/instantane/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasPosted(res.data.has_posted_today);
      setPosts(res.data.posts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching instantanes:", err);
      setError('Failed to load Instantanés.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'camera' && videoRef.current && stream && !preview) {
      videoRef.current.srcObject = stream;
    }
  }, [viewMode, stream, preview]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const capturedFile = new File([blob], 'instantane.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(URL.createObjectURL(capturedFile));
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setFile(null);
    startCamera();
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      await axios.post(`${API_URL}/api/instantane/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchInstantanes();
      setViewMode('grid'); // Go back to grid after posting
      setUploading(false);
      setPreview(null);
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || 'Failed to upload photo.');
      setUploading(false);
    }
  };

  const openCamera = () => {
    setViewMode('camera');
    startCamera();
  };

  const openViewer = (index) => {
    if (!hasPosted) return; // Cannot view if hasn't posted
    setCurrentIndex(index);
    setShowAllCaughtUp(false);
    setViewMode('viewer');
  };

  const closeViewer = () => {
    setViewMode('grid');
    setShowAllCaughtUp(false);
  };

  const handleNextStory = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowAllCaughtUp(true);
    }
  };

  const handleReaction = async (postId, emoji) => {
    try {
      const newPosts = [...posts];
      const postIdx = newPosts.findIndex(p => p.id === postId);
      if (postIdx > -1) {
        const post = newPosts[postIdx];
        const isRemoving = post.my_reaction === emoji;
        post.my_reaction = isRemoving ? null : emoji;
        setPosts(newPosts);
      }
      
      await axios.post(`${API_URL}/api/instantane/${postId}/react/`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" style={{ background: '#000', minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // --- GRID VIEW ---
  if (viewMode === 'grid') {
    return (
      <div className="instantane-container">
        <div className="instants-grid-container">
          <div className="instants-grid-header">
            <h1>Your instants</h1>
            <p>This is only visible to you</p>
          </div>

          <h2 className="instants-grid-section-title">Today</h2>
          
          {posts.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>No instants yet today.</p>
          ) : (
            <div className="instants-grid">
              {posts.map((post, idx) => (
                <div 
                  key={post.id} 
                  className={`instants-grid-item ${!hasPosted ? 'blurred locked' : ''}`}
                  onClick={() => openViewer(idx)}
                >
                  <img 
                    src={post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`} 
                    alt="Instant" 
                  />
                  {!hasPosted && (
                    <div className="instants-grid-item-overlay"></div>
                  )}
                  {hasPosted && post.my_reaction && (
                    <div style={{ position: 'absolute', top: 5, right: 5, fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '2px 6px' }}>
                      {post.my_reaction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasPosted && (
            <div className="create-recap-btn-container">
              <button className="create-recap-btn" onClick={openCamera}>
                <Plus size={20} />
                Create instant
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- CAMERA VIEW (UPLOAD) ---
  if (viewMode === 'camera') {
    return (
      <div className="story-viewer-overlay">
        <div className="instants-container" style={{ justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', width: '100%', padding: '0 1rem', position: 'absolute', top: '5vh' }}>
            <button onClick={() => { stopCamera(); setViewMode('grid'); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>

          <h1 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Create Instant</h1>

          {error && (
            <div className="alert-error glass mb-4" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '1rem', color: '#ef4444', borderRadius: '16px', background: '#1c1c1e', border: 'none' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="instants-content-layer">
            <div className="instants-image-wrapper">
              {preview ? (
                <img src={preview} alt="Preview" className="instants-image" />
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="instants-image"
                  style={{ transform: 'scaleX(-1)' }} 
                />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', width: '85%', marginTop: '2rem', justifyContent: 'center' }}>
              {!preview ? (
                <button 
                  style={{ 
                    background: '#fff', 
                    color: '#000', 
                    border: 'none', 
                    borderRadius: '50px', 
                    padding: '1rem 2rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                  onClick={handleCapture}
                >
                  <Camera size={24} />
                  <span>Capture</span>
                </button>
              ) : (
                <>
                  <button 
                    style={{ 
                      background: '#1c1c1e', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '50px', 
                      padding: '1rem 1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      fontSize: '1rem', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                    onClick={handleRetake}
                    disabled={uploading}
                  >
                    <RefreshCw size={20} />
                    Retake
                  </button>
                  <button 
                    style={{ 
                      background: '#fff', 
                      color: '#000', 
                      border: 'none', 
                      borderRadius: '50px', 
                      padding: '1rem 1.5rem', 
                      fontSize: '1rem', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      flex: 1
                    }}
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Posting...' : 'Share'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STORY VIEWER ---
  return (
    <div className="story-viewer-overlay">
      <div className="instants-container">
        {showAllCaughtUp || posts.length === 0 ? (
          <div className="caught-up-screen">
            <h2>You're all caught up!</h2>
            <p>Check back later for more Instants.</p>
            <button className="btn btn-primary" onClick={closeViewer}>
              Back to Grid
            </button>
          </div>
        ) : (
          <>
            <div className="instants-nav-area" onClick={handleNextStory}></div>

            <div className="instants-content-layer">
              <div className="instants-image-wrapper">
                <img 
                  key={posts[currentIndex].id}
                  src={posts[currentIndex].image.startsWith('http') ? posts[currentIndex].image : `${API_URL}${posts[currentIndex].image}`} 
                  alt="Story" 
                  className="instants-image"
                />
              </div>

              <div className="instants-user-info">
                {posts[currentIndex].user.profile_picture ? (
                  <img 
                    src={posts[currentIndex].user.profile_picture.startsWith('http') ? posts[currentIndex].user.profile_picture : `${API_URL}${posts[currentIndex].user.profile_picture}`} 
                    alt="User" 
                    className="instants-avatar" 
                  />
                ) : (
                  <div className="instants-avatar-placeholder">
                    {posts[currentIndex].user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="instants-username">{posts[currentIndex].user.first_name || posts[currentIndex].user.username}</span>
                  <span className="instants-time">
                    {new Date(posts[currentIndex].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <button onClick={closeViewer} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer', zIndex: 50 }}>
                  <X size={20} />
                </button>
              </div>

              <div className="instants-reactions">
                {EMOJIS.map(emoji => {
                  const isActive = posts[currentIndex].my_reaction === emoji;
                  return (
                    <button 
                      key={emoji}
                      className={`reaction-btn ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(posts[currentIndex].id, emoji);
                      }}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              <div className="instants-reply-box">
                Répondre à {posts[currentIndex].user.first_name || posts[currentIndex].user.username}...
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Instantane;
