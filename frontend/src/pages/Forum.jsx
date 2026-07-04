import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Image as ImageIcon, Send, X, Flag, Star } from 'lucide-react';
import './Forum.css';

function Forum({ hideHeader = false }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [showComments, setShowComments] = useState({});
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

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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

  const getLocalUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url).pathname;
    } catch {
      return url.replace(/^https?:\/\/[^\/]+/, '');
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
            <div className="post-footer px-4 md-px-6 py-3 bg-black-20 flex align-center">
              <button 
                className="btn-icon flex align-center gap-2 text-muted font-bold hover-primary"
                onClick={() => toggleComments(post.id)}
              >
                <MessageSquare size={18} /> {post.comments?.length || 0} Comments
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="comments-section bg-black-40 p-4 md-p-6">
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
                      <div className="comment-body bg-subtle-50">
                        <div className="flex justify-between align-center mb-1">
                          <span 
                            className="font-bold text-sm text-primary hover-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedUser(comment)}
                          >
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm m-0">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!post.comments || post.comments.length === 0) && (
                    <p className="text-sm text-muted italic text-center py-2 m-0">No comments yet. Be the first!</p>
                  )}
                </div>
                
                {/* Add Comment Input */}
                <div className="add-comment flex gap-2 align-center mt-2">
                  <input 
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
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center p-8 glass border-radius">
            <p className="text-muted m-0">No posts yet. Start the conversation!</p>
          </div>
        )}
      </section>

      {/* User Profile Popup Modal */}
      {selectedUser && (
        <div className="user-profile-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-profile-modal-card glass-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <div className="mx-auto mb-4" style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', backgroundColor: 'var(--bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
              {selectedUser.author_profile_picture ? (
                <img src={getLocalUrl(selectedUser.author_profile_picture)} alt={selectedUser.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>{selectedUser.author_name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <h2 style={{ color: 'var(--text-h)', margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedUser.author_full_name}</h2>
            <p className="text-muted" style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>@{selectedUser.author_name}</p>
            
            <div className="flex flex-col gap-3" style={{ textAlign: 'left', background: 'var(--bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '8px', borderRadius: '10px', color: '#3b82f6', display: 'flex' }}><Flag size={18} /></div>
                <div>
                  <div className="text-xs text-muted font-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Patrol</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>{selectedUser.author_patrol_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '8px', borderRadius: '10px', color: '#eab308', display: 'flex' }}><Star size={18} /></div>
                <div>
                  <div className="text-xs text-muted font-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Role</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>{selectedUser.author_role}</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

export default Forum;
