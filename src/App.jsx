import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import TrainingDetail from './pages/TrainingDetail.jsx';
import VideoPlayer from './pages/VideoPlayer.jsx';
import Community from './pages/Community.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import JornadaHIIT from './pages/JornadaHIIT.jsx';
import CalorieCalculator from './pages/CalorieCalculator.jsx';
import NutritionHistory from './pages/NutritionHistory.jsx';
import Header from './components/ui/Header.jsx';
import ImagePreloader from './components/ImagePreloader.jsx';
import PWALogin from './components/PWALogin.jsx';
import { usePWAAuth } from './hooks/usePWAAuth.js';
import { auth } from './firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useToast } from './components/ui/Toast.jsx';
import './App.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/smooth-loading.css';
import './pwa-ios-fix.css';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/auth" replace />;
}

function AppContent() {
  const { ToastContainer } = useToast();
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const { isPWA, isAuthenticated, loading, requiresAuth, login, logout } = usePWAAuth();

  const handlePreloadComplete = () => {
    setImagesPreloaded(true);
  };

  // Loading state para PWA Auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se é PWA e não está autenticado, mostrar tela de login
  if (requiresAuth) {
    return <PWALogin onLogin={login} />;
  }

  // Aplicação normal (navegador ou PWA autenticado)
  return (
    <>
      <ImagePreloader onLoadComplete={handlePreloadComplete}>
        <Router>
          <Header />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trainings/:id" element={<VideoPlayer />} />
            <Route path="/video/:moduleId/:videoId" element={<VideoPlayer />} />
            <Route path="/video/:moduleId" element={<VideoPlayer />} />
            <Route path="/player" element={<VideoPlayer />} />
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
            <Route 
              path="/jornada-hiit" 
              element={
                <PrivateRoute>
                  <JornadaHIIT />
                </PrivateRoute>
              }
            />
            {/* NOVAS ROTAS DA CALCULADORA DE CALORIAS */}
            <Route 
              path="/nutrition" 
              element={
                <PrivateRoute>
                  <CalorieCalculator />
                </PrivateRoute>
              }
            />
            <Route 
              path="/nutrition/history" 
              element={
                <PrivateRoute>
                  <NutritionHistory />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ImagePreloader>
      <ToastContainer />
      
      {/* Debug Info removido para produção */}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;

