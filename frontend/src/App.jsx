import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupProfile from './pages/GroupProfile';
import Forum from './pages/Forum';
import UserProfile from './pages/UserProfile';
import Instantane from './pages/Instantane';
import Games from './pages/Games';
import Wheel from './pages/Wheel';
import PianoGame from './pages/PianoGame';
import ProtectedRoute from './components/ProtectedRoute';

import BottomNav from './components/BottomNav';

function App() {
  return (
    <Router>
      <Navbar />
      <BottomNav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/group/:id" element={
            <ProtectedRoute>
              <GroupProfile />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/instantane" element={
            <ProtectedRoute>
              <Instantane />
            </ProtectedRoute>
          } />
          <Route path="/games" element={
            <ProtectedRoute>
              <Games />
            </ProtectedRoute>
          } />
          <Route path="/piano" element={
            <ProtectedRoute>
              <PianoGame />
            </ProtectedRoute>
          } />
          <Route path="/wheel" element={
            <ProtectedRoute>
              <Wheel />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
