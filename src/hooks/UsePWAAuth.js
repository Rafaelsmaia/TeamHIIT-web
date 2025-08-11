import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

export function usePWAAuth() {
  const [isPWA, setIsPWA] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    // Detectar se está rodando como PWA
    const checkPWA = () => {
      // Método 1: display-mode standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Método 2: navigator.standalone (iOS Safari)
      const isIOSStandalone = window.navigator.standalone === true;
      
      // Método 3: verificar se foi adicionado à tela inicial
      const isAddedToHomeScreen = window.matchMedia('(display-mode: standalone)').matches ||
                                   window.navigator.standalone ||
                                   document.referrer.includes('android-app://');

      return isStandalone || isIOSStandalone || isAddedToHomeScreen;
    };

    const pwaDetected = checkPWA();
    setIsPWA(pwaDetected);

    // Se não é PWA, não precisa de autenticação especial
    if (!pwaDetected) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Se é PWA, verificar autenticação Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário autenticado no Firebase
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Sincronizar com localStorage para consistência
        localStorage.setItem('pwa_authenticated', 'true');
        localStorage.setItem('pwa_user_email', user.email);
        localStorage.setItem('pwa_user_uid', user.uid);
      } else {
        // Usuário não autenticado
        setCurrentUser(null);
        setIsAuthenticated(false);
        
        // Limpar localStorage
        localStorage.removeItem('pwa_authenticated');
        localStorage.removeItem('pwa_user_email');
        localStorage.removeItem('pwa_user_uid');
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [auth]);

  const login = (success = true) => {
    if (success) {
      // O estado será atualizado automaticamente pelo onAuthStateChanged
      // quando o Firebase Auth detectar o login
      console.log('Login PWA confirmado');
    }
  };

  const logout = async () => {
    try {
      // Fazer logout do Firebase
      await signOut(auth);
      
      // Limpar localStorage
      localStorage.removeItem('pwa_authenticated');
      localStorage.removeItem('pwa_user_email');
      localStorage.removeItem('pwa_user_uid');
      
      // Estados serão atualizados automaticamente pelo onAuthStateChanged
      console.log('Logout PWA realizado');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Verificar se requer autenticação
  const requiresAuth = isPWA && !isAuthenticated;

  return {
    isPWA,
    isAuthenticated,
    loading,
    requiresAuth,
    currentUser,
    login,
    logout
  };
}

