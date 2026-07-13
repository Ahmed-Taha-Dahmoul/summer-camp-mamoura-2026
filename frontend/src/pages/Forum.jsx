import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Image as ImageIcon, Send, X, Flag, Star, Bird, Moon, Mountain, Sun, Compass, Tent, Heart, Smile } from 'lucide-react';
import './Forum.css';

function Forum({ hideHeader = false }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reactorsModal, setReactorsModal] = useState({ isOpen: false, reactors: [], type: '' });
  

  const [commentInputs, setCommentInputs] = useState({});
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: '/api/',
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('forum/posts/');
      setPosts(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !postImage) return;

    const formData = new FormData();
    formData.append('content', newPost);
    if (postImage) formData.append('image', postImage);

    try {
      await api.post('forum/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewPost('');
      removeImage();
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };



  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    try {
      await api.post('forum/comments/', { post: postId, content: content.trim() });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchPosts(); // refresh to show new comment
    } catch (err) {
      console.error(err);
    }
  };

  const handleReact = async (postId, type) => {
    try {
      await api.post(`forum/posts/${postId}/react/`, { type });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const getLocalUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url).pathname;
    } catch {
      return url.replace(/^https?:\/\/[^\/]+/, '');
    }
  };

  const getBannerGradient = (preset) => {
    switch(preset) {
      case 'forest': return 'linear-gradient(135deg, #064e3b, #10b981)';
      case 'mountain': return 'linear-gradient(135deg, #1e293b, #94a3b8)';
      case 'space': return 'linear-gradient(135deg, #0f172a, #8b5cf6)';
      case 'fire': return 'linear-gradient(135deg, #7f1d1d, #f59e0b)';
      default: return 'linear-gradient(135deg, #1e293b, #3b82f6)';
    }
  };

  const getThemeColor = (colorId) => {
    switch(colorId) {
      case 'red': return '#ef4444';
      case 'green': return '#10b981';
      case 'purple': return '#a855f7';
      case 'gold': return '#f59e0b';
      case 'blue':
      default: return '#3b82f6';
    }
  };

  const renderPatrolAvatar = (preset, color) => {
    const size = 22;
    switch(preset) {
      case 'eagle': return <Bird size={size} color={color} />;
      case 'wolf': return <Moon size={size} color={color} />;
      case 'bear': return <Mountain size={size} color={color} />;
      case 'lion': return <Sun size={size} color={color} />;
      case 'compass': return <Compass size={size} color={color} />;
      case 'tent': 
      default: return <Tent size={size} color={color} />;
    }
  };

  return (
    <div className={`forum container animate-fade-in ${hideHeader ? 'pt-0' : ''}`}>
      {!hideHeader && (
        <header className="forum-header">
          <h1>Camp Forum</h1>
          <p>Share your moments and talk with other groups!</p>
        </header>
      )}

      <section className="create-post glass border-radius mb-8 p-4 md-p-6">
        <form onSubmit={handlePostSubmit}>
          <textarea
            placeholder="What's happening at the camp?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="post-textarea"
            rows="3"
          ></textarea>
          
          {imagePreview && (
            <div className="post-image-preview-container">
              <button type="button" className="remove-image-btn" onClick={removeImage}>
                <X size={16} />
              </button>
              <img src={imagePreview} alt="Preview" className="post-image-preview" />
            </div>
          )}

          <div className="post-actions border-t-subtle">
            <button 
              type="button" 
              className="btn-icon text-primary flex align-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={20} /> <span className="font-bold">Photo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
            />
            <button type="submit" className="btn btn-primary px-6" disabled={!newPost.trim() && !postImage}>
              Post
            </button>
          </div>
        </form>
      </section>

      <section className="posts-feed">
        {posts.map(post => (
          <div key={post.id} className="post-card glass border-radius mb-6 overflow-hidden">
            {/* Header */}
            <div className="post-header p-4 md-p-6 pb-2 flex align-center gap-4">
              <div 
                className="avatar avatar-round bg-subtle" 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedUser(post)}
              >
                {post.author_profile_picture ? (
                  <img 
                    src={getLocalUrl(post.author_profile_picture)} 
                    alt={post.author_name} 
                    className="avatar-img"
                  />
                ) : (
                  <span className="avatar-initial">{post.author_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="author-info flex-column">
                <h4 
                  className="font-bold text-lg m-0 leading-tight hover-primary" 
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onClick={() => setSelectedUser(post)}
                >
                  {post.author_name}
                </h4>
                <span className="timestamp text-sm text-muted">{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Content Text */}
            {post.content && (
              <div className="post-content px-4 md-px-6 pb-4">
                <p className="whitespace-pre-wrap m-0">{post.content}</p>
              </div>
            )}

            {/* Edge-to-edge Image */}
            {post.image && (
              <div className="post-image-container bg-black">
                <img src={getLocalUrl(post.image)} alt="Post content" className="post-feed-image" />
              </div>
            )}

            {/* Footer / Interaction Bar */}
            <div className="post-footer px-4 md-px-6 py-3 bg-black-20 flex align-center justify-between">
              <div className="flex align-center gap-2">
                <div className="reaction-group flex align-center gap-1 mr-4">
                  <div className="reaction-container">
                    <button 
                      className={`reaction-btn-main ${
                        post.reactions?.user_reaction_type === 'HEART' ? 'reacted-heart' : 
                        post.reactions?.user_reaction_type === 'LAUGH' ? 'reacted-laugh' : ''
                      }`}
                      onClick={() => handleReact(post.id, post.reactions?.user_reaction_type ? post.reactions.user_reaction_type : 'HEART')}
                    >
                      {post.reactions?.user_reaction_type === 'LAUGH' ? (
                        <Smile size={20} />
                      ) : (
                        <Heart size={20} fill={post.reactions?.user_reaction_type === 'HEART' ? 'currentColor' : 'none'} />
                      )}
                      <span>React</span>
                    </button>

                    <div className="reaction-popover">
                      <div 
                        className="reaction-icon-wrapper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(post.id, 'HEART');
                        }}
                      >
                        <span className="reaction-icon-label">Love</span>
                        <Heart size={24} className="reaction-icon-heart" fill="currentColor" />
                      </div>
                      <div 
                        className="reaction-icon-wrapper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(post.id, 'LAUGH');
                        }}
                      >
                        <span className="reaction-icon-label">Haha</span>
                        <Smile size={24} className="reaction-icon-laugh" />
                      </div>
                    </div>
                  </div>
                  
                  {post.reactions?.count > 0 && (
                    <span 
                      className="reaction-count text-sm text-muted hover-primary ml-1"
                      onClick={() => setReactorsModal({ isOpen: true, reactors: post.reactions.reactors, type: 'All' })}
                    >
                      {post.reactions.count}
                    </span>
                  )}
                </div>

                <button 
                  className="btn-icon flex align-center gap-2 text-muted font-bold hover-primary"
                  onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
                >
                  <MessageSquare size={18} /> {post.comments?.length || 0} Comments
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="comments-section p-4 md-p-6" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                <div className="comments-list flex-column gap-4 mb-4">
                  {post.comments?.map(comment => (
                    <div key={comment.id} className="comment flex gap-3">
                      <div 
                        className="comment-avatar avatar-round bg-subtle flex-shrink-0"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedUser(comment)}
                      >
                        {comment.author_profile_picture ? (
                          <img src={getLocalUrl(comment.author_profile_picture)} alt="" className="avatar-img" />
                        ) : (
                          <span className="avatar-initial small">{comment.author_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="comment-body" style={{ backgroundColor: '#f1f5f9', borderRadius: '18px', padding: '10px 14px', color: '#1e293b' }}>
                        <div className="flex justify-between align-center mb-1">
                          <span 
                            className="font-bold text-sm text-primary hover-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedUser(comment)}
                          >
                            {comment.author_name}
                          </span>
                          <span className="text-xs" style={{ color: '#64748b' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm m-0">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!post.comments || post.comments.length === 0) && (
                    <p className="text-sm italic text-center py-2 m-0" style={{ color: '#94a3b8' }}>No comments yet. Be the first!</p>
                  )}
                </div>
                
                {/* Add Comment Input */}
                <div className="add-comment flex gap-2 align-center mt-2">
                  <input 
                    id={`comment-input-${post.id}`}
                    type="text" 
                    placeholder="Write a reply..." 
                    className="comment-input"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                  />
                  <button 
                    className="btn btn-primary btn-round"
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
              </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center p-8 glass border-radius">
            <p className="text-muted m-0">No posts yet. Start the conversation!</p>
          </div>
        )}
      </section>

      {/* User Profile Popup Modal */}
      {selectedUser && createPortal(
        <div className="user-profile-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div 
            className="user-profile-modal-card animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="profile-modal-glow"
              style={{ background: `radial-gradient(circle at top, ${getThemeColor(selectedUser.author_patrol_theme_color)}66 0%, transparent 80%)` }}
            ></div>
            
            <button className="profile-modal-close" onClick={() => setSelectedUser(null)}>
              <X size={20} />
            </button>
            
            <div 
              className="profile-modal-avatar"
              style={{ borderColor: '#ffffff' }}
            >
              {selectedUser.author_profile_picture ? (
                <img src={getLocalUrl(selectedUser.author_profile_picture)} alt={selectedUser.author_name} />
              ) : (
                <span>{selectedUser.author_name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <div className="profile-modal-info">
              <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {selectedUser.author_full_name}
                {selectedUser.author_patrol_theme_color === 'gold' && <Star size={20} color="#f59e0b" fill="#f59e0b" style={{ flexShrink: 0 }} />}
              </h2>
              <p className="username-text" style={{ color: getThemeColor(selectedUser.author_patrol_theme_color) }}>
                @{selectedUser.author_name}
              </p>
              
              <div className="profile-modal-badges">
                <div className="badge-row">
                  <div 
                    className="badge-icon" 
                    style={{ 
                      backgroundColor: `${getThemeColor(selectedUser.author_patrol_theme_color)}22`, 
                      color: getThemeColor(selectedUser.author_patrol_theme_color) 
                    }}
                  >
                    <Star size={20} />
                  </div>
                  <div className="badge-text">
                    <span className="badge-label">Role</span>
                    <span className="badge-value">{selectedUser.author_role}</span>
                  </div>
                </div>
                
                <div className="badge-row">
                  <div 
                    className="badge-icon" 
                    style={{ 
                      backgroundColor: `${getThemeColor(selectedUser.author_patrol_theme_color)}22`
                    }}
                  >
                    {renderPatrolAvatar(selectedUser.author_patrol_avatar_preset, getThemeColor(selectedUser.author_patrol_theme_color))}
                  </div>
                  <div className="badge-text">
                    <span className="badge-label">Taliaa (طليعة)</span>
                    <span 
                      className="badge-value"
                      style={{ color: getThemeColor(selectedUser.author_patrol_theme_color) }}
                    >
                      {selectedUser.author_patrol_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>,
        document.body
      )}

      {reactorsModal.isOpen && createPortal(
        <div className="reactions-modal-overlay animate-fade-in" onClick={() => setReactorsModal({ isOpen: false, reactors: [], type: '' })}>
          <div className="reactions-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="reactions-modal-header">
              <h3 className="m-0 font-bold flex align-center gap-2">
                Reactions
                <span className="badge badge-primary">{reactorsModal.reactors.length}</span>
              </h3>
              <button className="reactions-modal-close" onClick={() => setReactorsModal({ isOpen: false, reactors: [], type: '' })}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div className="reactors-list">
                {reactorsModal.reactors.map(reactor => (
                  <div key={reactor.id} className="reactor-item-white flex align-center gap-3">
                    <div className="avatar avatar-round bg-subtle relative flex-shrink-0" style={{ backgroundColor: '#f1f5f9' }}>
                      {reactor.profile_picture ? (
                        <img src={getLocalUrl(reactor.profile_picture)} alt="" className="avatar-img" />
                      ) : (
                        <span className="avatar-initial" style={{ color: '#64748b' }}>{reactor.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="reactor-info-white flex-grow">
                      <h5 className="m-0 font-bold text-md">{reactor.name}</h5>
                      <span className="text-sm">@{reactor.username}</span>
                    </div>
                    <div className="reaction-icon-right flex-shrink-0 flex align-center justify-center p-2 rounded-full" style={{ backgroundColor: reactor.type === 'HEART' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(234, 179, 8, 0.1)' }}>
                      {reactor.type === 'HEART' ? (
                        <Heart size={20} className="text-pink-500" fill="currentColor" />
                      ) : (
                        <Smile size={20} className="text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
                
                {reactorsModal.reactors.length === 0 && (
                  <div className="p-8 text-center text-muted italic">
                    No reactions yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default Forum;
