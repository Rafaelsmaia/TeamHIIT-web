import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Play, ArrowLeft, Bookmark, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/ui/Header.jsx';

function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(true); // Simplificado - assumir sempre logado
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Sistema de durações melhorado com debug
  const getVideoDuration = (videoUrl) => {
    console.log('🎥 Processando URL:', videoUrl);
    
    // Múltiplas formas de extrair o ID do YouTube
    let videoId = '';
    
    // Método 1: youtu.be/ID
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    }
    // Método 2: youtube.com/watch?v=ID
    else if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1].split('&')[0];
    }
    // Método 3: youtube.com/embed/ID
    else if (videoUrl.includes('youtube.com/embed/')) {
      videoId = videoUrl.split('embed/')[1].split('?')[0];
    }
    // Método 4: Apenas o ID
    else if (videoUrl.length === 11 && !videoUrl.includes('/')) {
      videoId = videoUrl;
    }
    
    console.log('🆔 ID extraído:', videoId);
    
    // Durações conhecidas do Projeto Verão
    const knownDurations = {
      'nNw3I_x5VfA': '32:15', // Treino 1
      'dguwzqWv8J0': '28:45', // Treino 2
      'IwDC3yAnLvE': '35:20', // Treino 3
      '1_jzxLkuM_c': '30:10', // Treino 4
      'h_D85tk5Xtc': '33:55', // Treino 5
      'KmVOQI1eQJA': '29:30', // Treino 6
      'b36K_GtmarM': '31:40', // Treino 7
      'KFixxjv9aHA': '34:25', // Treino 8
      'hrlFlNBBxbs': '36:15', // Treino 9
    };

    const duration = knownDurations[videoId] || '30-35 min';
    console.log('⏱️ Duração encontrada:', duration);
    
    return duration;
  };

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
              console.log('🎯 Treino encontrado:', foundTraining);
              
              // Para programas com estrutura de semanas (como DESAFIO 60 DIAS e MÓDULO COM HALTERES)
              if (foundTraining.modules && foundTraining.modules.length > 0 && foundTraining.modules[0].videos) {
                foundProgram = {
                  id: foundTraining.id,
                  title: foundTraining.title,
                  description: foundTraining.description || 'Programa de treinos completo.',
                  image: foundTraining.imageUrl,
                  level: foundTraining.level,
                  duration: foundTraining.duration,
                  categories: foundTraining.categories,
                  modules: foundTraining.modules.map(module => ({
                    id: module.id || `module-${Math.random()}`,
                    title: module.title,
                    videos: module.videos.map((video, index) => ({
                      id: `video-${index}`,
                      title: video.title,
                      videoUrl: video.videoUrl,
                      thumbnail: `https://img.youtube.com/vi/${video.videoUrl.split('/').pop().split('?')[0]}/maxresdefault.jpg`
                    }))
                  }))
                };
              } else {
                // Para programas simples com módulos diretos (como PROJETO VERÃO)
                console.log('📋 Módulos encontrados:', foundTraining.modules);
                
                foundProgram = {
                  id: foundTraining.id,
                  title: foundTraining.title,
                  description: foundTraining.description || 'Programa de treinos completo.',
                  image: foundTraining.imageUrl,
                  level: foundTraining.level,
                  duration: foundTraining.duration,
                  categories: foundTraining.categories,
                  modules: [{
                    id: 'main-module',
                    title: 'Treinos',
                    videos: foundTraining.modules.map((module, index) => {
                      console.log(`🎬 Processando vídeo ${index + 1}:`, module);
                      return {
                        id: `video-${index}`,
                        title: module.title,
                        videoUrl: module.videoUrl,
                        thumbnail: `https://img.youtube.com/vi/${module.videoUrl.split('/').pop().split('?')[0]}/maxresdefault.jpg`
                      };
                    })
                  }]
                };
              }
              
              console.log('🏗️ Programa construído:', foundProgram);
              
              setProgram(foundProgram);
              setTraining(foundTraining);
              setLoading(false);
              break;
            }
          }

          if (!foundTraining) {
            console.error('Treino não encontrado:', id);
            setLoading(false);
          }
        } else {
          console.error('Dados dos treinos não carregados');
          setLoading(false);
        }
      }
    };

    // Carregar dados dos treinos se não estiverem disponíveis
    if (!window.trainingsData) {
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = fetchTrainingData;
      script.onerror = () => {
        console.error('Erro ao carregar dados dos treinos');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      fetchTrainingData();
    }
  }, [id]);

  const handleVideoClick = (moduleId, videoId) => {
    if (!isSubscribed) {
      navigate('/checkout');
      return;
    }
    navigate(`/video/${training.id}/${moduleId}/${videoId}`);
  };

  const getVideosToShow = () => {
    if (!program || !program.modules || !program.modules[0]) return [];
    
    const allVideos = program.modules[0].videos;
    const videosPerPage = isMobile ? 5 : 8;
    const startIndex = currentVideoIndex;
    const endIndex = Math.min(startIndex + videosPerPage, allVideos.length);
    
    return allVideos.slice(startIndex, endIndex);
  };

  const canNavigateLeft = () => currentVideoIndex > 0;
  const canNavigateRight = () => {
    if (!program || !program.modules || !program.modules[0]) return false;
    const videosPerPage = isMobile ? 5 : 8;
    return currentVideoIndex + videosPerPage < program.modules[0].videos.length;
  };

  const navigateLeft = () => {
    if (canNavigateLeft()) {
      const videosPerPage = isMobile ? 5 : 8;
      setCurrentVideoIndex(Math.max(0, currentVideoIndex - videosPerPage));
    }
  };

  const navigateRight = () => {
    if (canNavigateRight()) {
      const videosPerPage = isMobile ? 5 : 8;
      setCurrentVideoIndex(currentVideoIndex + videosPerPage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!training || !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Treino não encontrado</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const videosToShow = getVideosToShow();
  const totalVideos = program.modules[0]?.videos?.length || 0;

  // TESTE: Vamos testar a função aqui
  console.log('🧪 TESTE: Testando função de duração');
  if (videosToShow.length > 0) {
    videosToShow.forEach((video, index) => {
      console.log(`🧪 Testando vídeo ${index + 1}:`, video.title, video.videoUrl);
      const testDuration = getVideoDuration(video.videoUrl);
      console.log(`🧪 Resultado:`, testDuration);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar ao Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Vídeos */}
          <div className="lg:col-span-2">
            {/* Header do Programa */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-start gap-4">
                <img
                  src={`/${program.image}`}
                  alt={program.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {program.categories.map(category => (
                      <span key={category} className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">{program.description}</p>
                </div>
              </div>
            </div>

            {/* Próximos Treinos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">PRÓXIMOS TREINOS</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={navigateLeft}
                    disabled={!canNavigateLeft()}
                    className={`p-2 rounded-full ${
                      canNavigateLeft() 
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={navigateRight}
                    disabled={!canNavigateRight()}
                    className={`p-2 rounded-full ${
                      canNavigateRight() 
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    } transition-colors`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {videosToShow.map((video, index) => {
                  console.log(`🎯 RENDERIZANDO: ${video.title} - URL: ${video.videoUrl}`);
                  const duration = getVideoDuration(video.videoUrl);
                  console.log(`🎯 DURAÇÃO FINAL: ${duration}`);
                  
                  return (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(program.modules[0].id, video.id)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{video.title}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{duration}</span>
                        </div>
                      </div>
                      {!isSubscribed && (
                        <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          Premium
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalVideos > (isMobile ? 5 : 8) && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Mostrando {Math.min(currentVideoIndex + videosToShow.length, totalVideos)} de {totalVideos} treinos
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Informações */}
          <div className="space-y-6">
            {/* Informações do Treino */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Treino</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>Duração</span>
                  </div>
                  <span className="font-medium text-gray-900">30-40 min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Star className="w-5 h-5 mr-2" />
                    <span>Dificuldade</span>
                  </div>
                  <span className="font-medium text-gray-900">{program.level}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-2" />
                    <span>Categoria</span>
                  </div>
                  <span className="font-medium text-gray-900">{program.categories[0]}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Star className="w-5 h-5 mr-2" />
                    <span>Avaliação</span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">(4.8)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Salvar
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </button>
              </div>
            </div>

            {/* Call to Action para não assinantes */}
            {!isSubscribed && (
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Acesso Premium</h3>
                <p className="text-red-100 mb-4 text-sm">
                  Tenha acesso completo a todos os treinos e funcionalidades exclusivas.
                </p>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-white text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Assinar Agora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingDetail;

