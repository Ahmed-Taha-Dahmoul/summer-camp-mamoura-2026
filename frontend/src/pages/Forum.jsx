import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Image as ImageIcon } from 'lucide-react';
import './Forum.css';

function Forum({ hideHeader = false }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
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

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      await api.post('forum/posts/', { content: newPost });
      setNewPost('');
      fetchPosts();
    } catch (err) {
      console.error(err);
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

      <section className="create-post glass border-radius p-6 mb-8">
        <form onSubmit={handlePostSubmit}>
          <textarea
            placeholder="What's happening at the camp?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="post-textarea"
            rows="3"
          ></textarea>
          <div className="post-actions">
            <button type="button" className="btn-icon">
              <ImageIcon size={20} /> Photo
            </button>
            <button type="submit" className="btn btn-primary">Post</button>
          </div>
        </form>
      </section>

      <section className="posts-feed">
        {posts.map(post => (
          <div key={post.id} className="post-card glass border-radius p-6 mb-4">
            <div className="post-header">
              <div className="avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                {post.author_profile_picture ? (
                  <img 
                    src={post.author_profile_picture.replace(/^https?:\/\/[^\/]+/, '')} 
                    alt={post.author_name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{post.author_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="author-info">
                <h4>{post.author_name}</h4>
                <span className="timestamp">{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="post-content">
              <p>{post.content}</p>
            </div>
            <div className="post-footer">
              <button className="btn-icon"><MessageSquare size={18} /> {post.comments?.length || 0} Comments</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Forum;
