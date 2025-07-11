import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import TrainingDetail from './pages/TrainingDetail.jsx';
import Community from './pages/Community.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import { auth } from './firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './App.css';
import './styles/responsive.css';
import './styles/animations.css';

function PrivateRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return currentUser ? children : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trainings/:id" element={<TrainingDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/community" 
          element={
            <PrivateRoute>
              <Community />
            </PrivateRoute>
          }
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


