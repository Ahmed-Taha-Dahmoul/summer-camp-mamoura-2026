import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, AlertCircle, RefreshCw, X, Plus, SwitchCamera, Grid, ZapOff, Zap, Users } from 'lucide-react';
import './Instantane.css';

const EMOJIS = ['❤️', '🔥', '😂', '😮'];

function Instantane() {
  const navigate = useNavigate();
  const [hasPosted, setHasPosted] = useState(false);
  const [postsTodayCount, setPostsTodayCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [myPost, setMyPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  
  // View states: 'camera', 'viewer', 'my_instants'
  const [viewMode, setViewMode] = useState('camera');
  
  // My Instants state
  const [myInstantsList, setMyInstantsList] = useState([]);
  const [selectedInstant, setSelectedInstant] = useState(null);
  
  // Moderation state
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [hasUnlimited, setHasUnlimited] = useState(false);
  const [moderatedPosts, setModeratedPosts] = useState([]);

  // Story state
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const token = localStorage.getItem('access_token');
  const API_URL = '';

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

  const startCamera = async (mode = facingMode) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1920 } } 
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

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopCamera();
    startCamera(newMode);
  };

  const toggleFlash = async () => {
    const newFlashState = !flashOn;
    setFlashOn(newFlashState);
    
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ torch: newFlashState }]
            });
          } catch (err) {
            console.error("Error applying torch constraint:", err);
          }
        }
      }
    }
  };

  const fetchInstantanes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/instantane/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasPosted(res.data.has_posted_today);
      setPostsTodayCount(res.data.posts_today_count || 0);
      setHasUnlimited(res.data.has_unlimited_instants || false);
      setHasModerationAccess(res.data.has_moderation_access || false);
      setPosts(res.data.posts);
      setMyPost(res.data.my_post);
      
      if (!res.data.has_posted_today || res.data.posts.length === 0) {
        setViewMode('camera');
        startCamera();
      } else {
        setViewMode('viewer');
        stopCamera();
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching instantanes:", err);
      setError('Failed to load Instantanés.');
      setLoading(false);
    }
  };

  const fetchMyInstants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/instantane/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyInstantsList(res.data);
    } catch (err) {
      console.error("Error fetching my instants:", err);
    }
  };

  const fetchModeratedPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/instantane/moderation/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModeratedPosts(res.data);
    } catch (err) {
      console.error("Error fetching moderation posts:", err);
    }
  };

  const openMyInstants = () => {
    fetchMyInstants();
    setViewMode('my_instants');
  };

  const openModeration = () => {
    fetchModeratedPosts();
    setViewMode('moderation');
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this instantane?")) return;
    try {
      await axios.delete(`${API_URL}/api/instantane/moderation/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModeratedPosts(moderatedPosts.filter(p => p.id !== id));
      fetchInstantanes(); // Refresh main feed
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  useEffect(() => {
    if (viewMode === 'camera' && videoRef.current && stream && !preview) {
      videoRef.current.srcObject = stream;
    }
  }, [viewMode, stream, preview]);

  const handleCapture = () => {
    if (!hasUnlimited && postsTodayCount >= 4) {
      alert("You cannot take more than 4 Instants per day!");
      return;
    }
    
    if (flashOn) {
      setFlashEffect(true);
    }
    
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
        canvas.toBlob((blob) => {
          const capturedFile = new File([blob], 'instantane.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setPreview(URL.createObjectURL(capturedFile));
          stopCamera();
          if (flashOn) {
            setFlashEffect(false);
          }
        }, 'image/jpeg', 0.92);
      }
    }, flashOn ? 150 : 0);
  };

  const handleRetake = () => {
    setPreview(null);
    setFile(null);
    startCamera(facingMode);
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
      setViewMode('viewer'); 
      setUploading(false);
      setPreview(null);
      setFile(null);
      setCurrentIndex(0); // Reset to first story
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

  const closeViewer = () => {
    if (selectedInstant) {
      setSelectedInstant(null);
    } else if (viewMode === 'my_instants' || viewMode === 'moderation') {
      setViewMode('camera');
    } else {
      navigate('/');
    }
  };

  const handleNextStory = async () => {
    if (!hasPosted) return; // Prevent next if locked
    
    if (currentIndex < posts.length) {
      // Mark current as viewed in background
      const currentPostId = posts[currentIndex].id;
      axios.post(`${API_URL}/api/instantane/${currentPostId}/view/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error("Error marking viewed:", err));
      
      if (currentIndex < posts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setViewMode('camera');
        startCamera();
        setCurrentIndex(0);
      }
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

  // --- CAMERA VIEW (UPLOAD) ---
  if (viewMode === 'camera') {
    return (
      <div className="camera-view-container">
        
        {/* Top Header */}
        <div className="camera-header">
          <button onClick={() => { stopCamera(); navigate('/'); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={28} />
          </button>
          <h2 className="camera-title">Nouvel instantané</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '44px' }}>
            <button onClick={() => { stopCamera(); openMyInstants(); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
              <Grid size={28} />
            </button>
            {hasModerationAccess && (
              <button 
                className="moderation-btn"
                style={{ position: 'absolute', top: '100%', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.85)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 110 }}
                onClick={() => { stopCamera(); openModeration(); }}
                title="Moderation Dashboard"
              >
                <AlertCircle size={20} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '0 1rem', padding: '1rem', color: '#ef4444', background: '#1c1c1e', borderRadius: '12px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Camera Viewport */}
        <div className="camera-viewport-wrapper">
          <div className="camera-viewport">
            {flashEffect && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 50 }}></div>
            )}
            {preview ? (
              <img src={preview} alt="Preview" />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} 
              />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="camera-controls">
          <div className="camera-buttons-row">
            {!preview ? (
              <>
                <button className="secondary-cam-btn" onClick={toggleFlash}>
                  {flashOn ? <Zap size={24} color="#fbbf24" fill="#fbbf24" /> : <ZapOff size={24} />}
                </button>
                
                <button className="capture-btn-outer" onClick={handleCapture}>
                  <div className="capture-btn-inner"></div>
                </button>
                
                <button className="secondary-cam-btn" onClick={toggleCamera}>
                  <RefreshCw size={24} />
                </button>
              </>
            ) : (
              <>
                <button className="secondary-cam-btn" onClick={handleRetake} disabled={uploading}>
                  <X size={24} />
                </button>
                
                <button 
                  style={{ 
                    background: '#fff', 
                    color: '#000', 
                    border: 'none', 
                    borderRadius: '50px', 
                    padding: '1rem 2.5rem', 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
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
    );
  }

  // --- STORY VIEWER (MY POSTS LIST) ---
  if (viewMode === 'my_instants') {
    return (
      <div className="story-viewer-overlay" style={{ overflowY: 'auto' }}>
        <div className="instants-container" style={{ padding: '2rem 1rem', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', margin: 0 }}>My Instants</h2>
            <button onClick={closeViewer} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>

          {myInstantsList.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>You haven't shared any Instants yet.</p>
          ) : (
            <div className="my-instants-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {myInstantsList.map(post => (
                <div 
                  key={post.id} 
                  className="my-instant-card"
                  onClick={() => setSelectedInstant(post)}
                  style={{ cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', position: 'relative', aspectRatio: '3/4', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                >
                  <img 
                    src={post.image ? post.image.replace(/^https?:\/\/[^\/]+/, '') : ''} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="My Instant"
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem 0.5rem 0.5rem 0.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', color: 'white', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>{post.detailed_reactions?.length || 0} Reacts</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedInstant && (
            <div className="story-viewer-overlay" style={{ zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }}>
              <button onClick={() => setSelectedInstant(null)} style={{ position: 'absolute', top: '2rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 210, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
              
              <div className="detail-image-wrapper">
                <img 
                  src={selectedInstant.image ? selectedInstant.image.replace(/^https?:\/\/[^\/]+/, '') : ''} 
                  className="detail-image"
                  alt="Selected Instant"
                />
              </div>

              <div className="reactions-detail-sheet">
                <div className="sheet-drag-handle"></div>
                <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', textAlign: 'left', fontSize: '1.3rem', fontWeight: 600 }}>Reactions ({selectedInstant.detailed_reactions?.length || 0})</h3>
                
                {selectedInstant.detailed_reactions && selectedInstant.detailed_reactions.length > 0 ? (
                  <div className="reactions-list">
                    {selectedInstant.detailed_reactions.map((react, idx) => (
                      <div key={idx} className="reaction-user-row">
                        <div className="reaction-user-avatar-wrapper">
                          {react.user.profile_picture ? (
                            <img 
                              src={react.user.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} 
                              alt={react.user.username}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {react.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="reaction-emoji-badge">{react.emoji}</div>
                        </div>
                        <span className="reaction-user-name">{react.user.first_name || react.user.username}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-reactions">
                    <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>👻</span>
                    <p style={{ color: '#aaa', margin: 0 }}>No reactions yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MODERATION DASHBOARD ---
  if (viewMode === 'moderation') {
    return (
      <div className="story-viewer-overlay" style={{ overflowY: 'auto' }}>
        <div className="instants-container" style={{ padding: '2rem 1rem', display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#ef4444', margin: 0 }}>Moderation</h2>
            <button onClick={closeViewer} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>

          {moderatedPosts.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>No posts to moderate.</p>
          ) : (
            <div className="my-instants-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {moderatedPosts.map(post => (
                <div 
                  key={post.id} 
                  className="my-instant-card"
                  style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative', aspectRatio: '3/4', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                >
                  <img 
                    src={post.image ? post.image.replace(/^https?:\/\/[^\/]+/, '') : ''} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="Moderation Instant"
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.5rem', background: 'linear-gradient(rgba(0,0,0,0.8), transparent)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="avatar-placeholder" style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>
                      {post.user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{post.user.first_name || post.user.username}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STORY VIEWER (FEED) ---
  return (
    <div className="camera-view-container">
      
      {/* Top Header */}
      <div className="camera-header">
        <button onClick={() => { navigate('/'); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
          <X size={28} />
        </button>
        <h2 className="camera-title">Instantanés</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '44px' }}>
          <button onClick={() => { openMyInstants(); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
            <Grid size={28} />
          </button>
          {hasModerationAccess && (
            <button 
              className="moderation-btn"
              style={{ position: 'absolute', top: '100%', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.85)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 110 }}
              onClick={() => { openModeration(); }}
              title="Moderation Dashboard"
            >
              <AlertCircle size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Viewer Viewport */}
      <div className="camera-viewport-wrapper" onClick={handleNextStory} style={{ cursor: 'pointer' }}>
        <div className="camera-viewport">
          <img 
            src={posts[currentIndex]?.image ? posts[currentIndex].image.replace(/^https?:\/\/[^\/]+/, '') : ''} 
            alt="Story" 
          />
          
          {/* Overlay User Info */}
          {posts[currentIndex] && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(rgba(0,0,0,0.7), transparent)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10 }}>
              {posts[currentIndex].user.profile_picture ? (
                <img src={posts[currentIndex].user.profile_picture.replace(/^https?:\/\/[^\/]+/, '')} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} alt="" />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {posts[currentIndex].user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {posts[currentIndex].user.first_name || posts[currentIndex].user.username}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#ddd', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {new Date(posts[currentIndex].created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reactions Controls */}
      <div className="camera-controls">
        <div className="instants-reactions" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', width: '100%', padding: '0 2rem' }}>
          {EMOJIS.map(emoji => {
            const isActive = posts[currentIndex]?.my_reaction === emoji;
            return (
              <button 
                key={emoji}
                className={`reaction-btn ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if(posts[currentIndex]) handleReaction(posts[currentIndex].id, emoji);
                }}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Instantane;
