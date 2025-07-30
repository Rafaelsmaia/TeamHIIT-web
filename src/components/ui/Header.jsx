import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Home, User, Settings, LogOut, Users, Trophy, Bell, ChevronDown, Calculator } from 'lucide-react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

function Header() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  // Fechar menu suspenso ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileMenuOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error("Erro ao fazer logout: ", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleProfileMenuClick = (action) => {
    setIsProfileMenuOpen(false);
    
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'journey':
        navigate('/jornada-hiit');
        break;
      case 'settings':
        // Navegar para configurações/gerenciar conta (quando implementada)
        console.log('Navegar para Gerenciar Conta');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* HEADER SIMPLES - SEM SAFE AREA */}
      <header 
        className="bg-gray-900 text-white shadow-lg fixed top-0 left-0 right-0 z-50"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 50,
          backgroundColor: '#111827',
          margin: 0,
          padding: 0
          // SEM padding-top aqui - vai até o topo físico
        }}
      >
        {/* CONTAINER COM SAFE AREA */}
        <div 
          className="container mx-auto px-6"
          style={{
            paddingTop: 'env(safe-area-inset-top, 44px)',
            backgroundColor: '#111827'
          }}
        >
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              {/* Logo Team HIIT */}
              <img 
                src="/fina.png" 
                alt="Team HIIT Logo" 
                className="h-8"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => navigate(currentUser ? '/community' : '/auth')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <Users className="w-4 h-4" />
                <span>InstaHIIT</span>
              </button>

              {/* NOVA ABA NUTRIÇÃO */}
              <button
                onClick={() => navigate(currentUser ? '/nutrition' : '/auth')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <Calculator className="w-4 h-4" />
                <span>Nutrição</span>
              </button>

              {currentUser && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Foto de Perfil" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span>{currentUser.displayName || 'Usuário'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Menu suspenso do perfil */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* Cabeçalho do menu com nome do usuário */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            {currentUser.photoURL ? (
                              <img src={currentUser.photoURL} alt="Foto de Perfil" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{currentUser.displayName || 'Usuário'}</span>
                        </div>
                      </div>

                      {/* Opções do menu */}
                      <button
                        onClick={() => handleProfileMenuClick('profile')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Meu perfil</span>
                      </button>

                      <button
                        onClick={() => handleProfileMenuClick('journey')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Trophy className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Jornada HIIT</span>
                      </button>

                      <button
                        onClick={() => handleProfileMenuClick('settings')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Gerenciar conta</span>
                      </button>

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => handleProfileMenuClick('logout')}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Sair</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!currentUser && (
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    navigate(currentUser ? '/community' : '/auth');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <Users className="w-5 h-5" />
                  <span>InstaHIIT</span>
                </button>

                {/* NOVA ABA NUTRIÇÃO - MOBILE */}
                <button
                  onClick={() => {
                    navigate(currentUser ? '/nutrition' : '/auth');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Nutrição</span>
                </button>
                
                {currentUser && (
                  <>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                    >
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Foto de Perfil" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span>Meu perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/jornada-hiit');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                    >
                      <Trophy className="w-5 h-5" />
                      <span>Jornada HIIT</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        // Navegar para Gerenciar conta (quando implementada)
                        console.log('Navegar para Gerenciar Conta');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Gerenciar conta</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sair</span>
                    </button>
                  </>
                )}
                {!currentUser && (
                  <button
                    onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 text-left"
                  >
                    <User className="w-5 h-5" />
                    <span>Entrar</span>
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* PSEUDO-ELEMENTO PARA GARANTIR BACKGROUND ATÉ O TOPO */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top, 44px)',
          backgroundColor: '#111827',
          zIndex: 49
        }}
      />
    </>
  );
}

export default Header;

