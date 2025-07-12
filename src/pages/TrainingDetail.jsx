import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, User, ChevronLeft, ChevronRight, Lock, Crown } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Header from '../components/ui/Header.jsx';

// Helper function to get YouTube video ID
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|youtube.com\/user\/[^\/]+\/|youtube.com\/\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const carouselRefs = useRef({}); // Ref to hold carousel containers for dynamic scroll
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Tailwind's 'md' breakpoint is 768px

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Verificar se o usuário é assinante
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsSubscriber(userData.isSubscriber || false);
          } else {
            setIsSubscriber(false);
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura:', error);
          setIsSubscriber(false);
        }
      } else {
        setIsSubscriber(false);
      }
      
      setCheckingSubscription(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTrainingData = () => {
      if (id === 'projeto-verao') {
        const script = document.createElement('script');
        script.src = '/projeto-verao.js';
        script.onload = () => {
          if (window.projetoVeraoData) {
            setProgram(window.projetoVeraoData);
            setTraining({
              id: 'projeto-verao',
              title: 'PROJETO VERÃO',
              description: 'Prepare-se para o verão com este programa intenso.'
            });
            setLoading(false);
          }
        };
        script.onerror = () => {
          console.error('Erro ao carregar dados do Projeto Verão');
          setLoading(false);
        };
        document.head.appendChild(script);
      } else {
        if (window.trainingsData && window.trainingsData.sections) {
          let foundTraining = null;
          let foundProgram = null;

          for (const section of window.trainingsData.sections) {
            foundTraining = section.trainings.find(t => t.id === id);
            if (foundTraining) {
              // Para programas com estrutura de semanas (como DESAFIO 60 DIAS e MÓDULO COM HALTERES)
              if (foundTraining.modules && foundTraining.modules.length > 0 && foundTraining.modules[0].videos) {
                foundProgram = {
                  id: foundTraining.id,
                  title: foundTraining.title,
                  description: foundTraining.description || `Programa completo de ${foundTraining.title}`,
                  instructor: "Renan Gonçalves",
                  duration: foundTraining.duration || "4 semanas",
                  level: foundTraining.level || "Todos os níveis",
                  image: foundTraining.imageUrl,
                  sections: foundTraining.modules.map(module => ({
                    id: module.title.toLowerCase().replace(/\s+/g, '-'),
                    title: module.title,
                    description: module.description,
                    modules: module.videos.map((video, index) => ({
                      id: `video-${index}`,
                      title: video.title,
                      description: video.title,
                      duration: "30-40 min",
                      youtubeId: video.youtubeId,
                      type: "Treino"
                    }))
                  }))
                };
              } 
              // Para programas com estrutura simples (como desafios de sessão única)
              else if (foundTraining.modules && foundTraining.modules.length > 0) {
                foundProgram = {
                  id: foundTraining.id,
                  title: foundTraining.title,
                  description: foundTraining.description || `Programa completo de ${foundTraining.title}`,
                  instructor: "Renan Gonçalves",
                  duration: foundTraining.duration || "Vários módulos",
                  level: foundTraining.level || "Todos os níveis",
                  image: foundTraining.imageUrl,
                  sections: [
                    {
                      id: "treinos",
                      title: "Treinos",
                      description: "Programa completo de treinos",
                      modules: foundTraining.modules.map((module, index) => {
                        // Para desafios com estrutura antiga (videoUrl direto)
                        if (module.videoUrl) {
                          return {
                            id: `modulo-${index + 1}`,
                            title: module.title,
                            description: `Treino ${module.title}`,
                            videoUrl: module.videoUrl,
                            youtubeId: getYouTubeVideoId(module.videoUrl),
                            duration: "30-40 min",
                            type: "Treino"
                          };
                        }
                        // Para desafios com youtubeId direto
                        else if (module.youtubeId) {
                          return {
                            id: `modulo-${index + 1}`,
                            title: module.title,
                            description: `Treino ${module.title}`,
                            videoUrl: `https://youtu.be/${module.youtubeId}`,
                            youtubeId: module.youtubeId,
                            duration: "30-40 min",
                            type: "Treino"
                          };
                        }
                        // Fallback
                        return {
                          id: `modulo-${index + 1}`,
                          title: module.title,
                          description: `Treino ${module.title}`,
                          videoUrl: null,
                          youtubeId: null,
                          duration: "30-40 min",
                          type: "Treino"
                        };
                      })
                    }
                  ]
                };
              } else {
                // Estrutura genérica para treinos sem módulos específicos
                foundProgram = {
                  id: foundTraining.id,
                  title: foundTraining.title,
                  description: foundTraining.description || `Programa completo de ${foundTraining.title}`,
                  instructor: "Renan Gonçalves",
                  duration: foundTraining.duration || "Vários módulos",
                  level: foundTraining.level || "Todos os níveis",
                  image: foundTraining.imageUrl,
                  sections: [
                    {
                      id: "modulos",
                      title: "Módulos do Programa",
                      description: "Conteúdo do programa",
                      modules: [
                        {
                          id: "aula-1",
                          title: "Aula 1",
                          description: "Primeira aula do programa",
                          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                          duration: "30 min",
                          type: "Treino"
                        }
                      ]
                    }
                  ]
                };
              }
              break;
            }
          }

          setTraining(foundTraining);
          setProgram(foundProgram);
          setLoading(false);
        }
      }
    };

    if (id !== 'projeto-verao' && !window.trainingsData) {
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = fetchTrainingData;
      script.onerror = () => {
        console.error('Erro ao carregar arquivo de treinos');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      fetchTrainingData();
    }
  }, [id]);

  const scrollCarousel = (sectionId, direction) => {
    const carouselElement = carouselRefs.current[sectionId];
    if (carouselElement) {
      const cardWidth = carouselElement.querySelector('.flex-shrink-0').offsetWidth;
      const scrollAmount = cardWidth + 16; // 16px for space-x-4
      carouselElement.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  const needsNavigation = (section) => {
    // Sempre mostra navegação se há mais de 4 módulos
    return section.modules && section.modules.length > 4;
  };

  // Função para navegar para o VideoPlayer ou mostrar alerta de assinatura
  const handleVideoClick = (module) => {
    if (!isSubscriber) {
      // Mostrar modal ou alerta para não-assinantes
      const shouldUpgrade = window.confirm(
        'Este conteúdo é exclusivo para assinantes do Team HIIT.\n\nGostaria de se tornar um assinante para acessar todo o conteúdo?'
      );
      
      if (shouldUpgrade) {
        // Redirecionar para página de assinatura
        window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
      }
      return;
    }

    const videoId = module.youtubeId || (module.videoUrl ? getYouTubeVideoId(module.videoUrl) : null);
    
    if (videoId) {
      navigate(`/video/${module.id}/${videoId}`, {
        state: {
          title: module.title,
          youtubeId: videoId,
          description: module.description || `Vídeo do ${module.title}`,
          duration: module.duration || '30-40 min',
          level: program?.level || 'Intermediário',
          instructor: program?.instructor || 'Team HIIT',
          category: training?.categories?.[0] || 'Treino'
        }
      });
    } else {
      // Fallback para abrir em nova aba se não conseguir extrair o ID
      if (module.videoUrl) {
        window.open(module.videoUrl, '_blank');
      }
    }
  };

  const handleSubscriptionUpgrade = () => {
    // Redirecionar para página de assinatura ou contato
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
  };

  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando detalhes do programa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!training || !program) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="container mx-auto px-6 py-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Programa não encontrado</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      
      {/* Banner do Programa */}
      <div className="w-full relative" style={{ height: '50vh' }}>
        <img 
          src={`/${program.image}`}
          alt={program.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-2">{program.title}</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">{program.description}</p>
            <div className="mt-4 flex justify-center space-x-4">
              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm">
                <User className="w-4 h-4 inline mr-1" />
                {program.instructor}
              </span>
              <span className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                {program.duration}
              </span>
              {isSubscriber && (
                <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  Assinante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Botão Voltar */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
        </div>

        {/* Call to Action para não-assinantes */}
        {!isSubscriber && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="w-8 h-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Conteúdo Exclusivo para Assinantes</h3>
                  <p className="text-white/90">
                    Torne-se assinante para acessar todos os vídeos e treinos do Team HIIT!
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubscriptionUpgrade}
                className="bg-white text-orange-500 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Assinar Agora
              </button>
            </div>
          </div>
        )}

        {/* Seções do Programa - Cada semana como seção separada */}
        {program.sections && program.sections.map(section => (
          <div key={section.id} className="mb-8">
            {/* Título da Seção */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{section.title}</h3>
              {section.description && (
                <p className="text-gray-400">{section.description}</p>
              )}
            </div>

            {/* Vídeos da Seção */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              {isMobile ? (
                <div className="flex flex-col space-y-4">
                  {section.modules.map(module => {
                    const videoId = module.youtubeId || (module.videoUrl ? getYouTubeVideoId(module.videoUrl) : null);
                    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                    return (
                      <div key={module.id} className="flex items-center bg-gray-700 rounded-lg overflow-hidden p-2 relative">
                        {/* Overlay de cadeado para não-assinantes */}
                        {!isSubscriber && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-shrink-0 relative w-24 h-16 mr-4">
                          {thumbnailUrl ? (
                            <img 
                              src={thumbnailUrl} 
                              alt={module.title} 
                              className="w-full h-full object-cover rounded-md"
                            />
                           ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center rounded-md">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 opacity-0 hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleVideoClick(module)}
                              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors"
                            >
                              {isSubscriber ? <Play className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm truncate">{module.title}</h4>
                          <p className="text-gray-400 text-xs truncate">{module.description}</p>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-400 text-xs">{module.duration}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleVideoClick(module)}
                          className={`px-3 py-1 rounded text-xs transition-colors ml-2 ${
                            isSubscriber 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {isSubscriber ? 'Assistir Aula' : 'Bloqueado'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative">
                  {needsNavigation(section) && (
                    <>
                      <button
                        onClick={() => scrollCarousel(section.id, -1)}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => scrollCarousel(section.id, 1)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  <div 
                    ref={el => carouselRefs.current[section.id] = el}
                    className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {section.modules.map(module => {
                      const videoId = module.youtubeId || (module.videoUrl ? getYouTubeVideoId(module.videoUrl) : null);
                      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                      return (
                        <div key={module.id} className="flex-shrink-0 w-80 bg-gray-700 rounded-lg overflow-hidden relative">
                          {/* Overlay de cadeado para não-assinantes */}
                          {!isSubscriber && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                              <div className="text-center text-white">
                                <Lock className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Conteúdo Exclusivo</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="relative h-48">
                            {thumbnailUrl ? (
                              <img 
                                src={thumbnailUrl} 
                                alt={module.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 opacity-0 hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleVideoClick(module)}
                                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full transition-colors"
                              >
                                {isSubscriber ? <Play className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="text-white font-semibold mb-2">{module.title}</h4>
                            <p className="text-gray-400 text-sm mb-3">{module.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-gray-400 text-sm">{module.duration}</span>
                              </div>
                              <button 
                                onClick={() => handleVideoClick(module)}
                                className={`px-4 py-2 rounded text-sm transition-colors ${
                                  isSubscriber 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                }`}
                              >
                                {isSubscriber ? 'Assistir Aula' : 'Bloqueado'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrainingDetail;